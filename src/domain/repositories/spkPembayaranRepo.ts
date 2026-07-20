import {
  Prisma,
  Role,
  SpkPembayaranStatus,
} from "@prisma/client";
import type { PrismaClient } from "@prisma/client";
import type { SpkPembayaranJenis } from "@prisma/client";
import type { ISpkPembayaranRepository } from "./ISpkPembayaranRepo.js";
import type {
  AddBuktiSpkPembayaranDTO,
  BayarSpkPembayaranDTO,
  CreateSpkPembayaranDTO,
  RemoveBuktiSpkPembayaranDTO,
  SetBsiCmsDilaporkanDTO,
  SpkPembayaranFilterDTO,
  UpdateSpkKasbonDTO,
  UpdateSpkUpahDTO,
  SpkPembayaranKasbonBarisInput,
  SpkPembayaranUpahBarisInput,
} from "../dtos/SpkPembayaranDTO.js";
import type { SpkPembayaranEntity } from "../entities/SpkPembayaran.js";
import type { OffsetPaginatedData } from "../../types/response.js";
import { SpkPembayaranMapper } from "../../infrastructure/mapper/SpkPembayaranMapper.js";
import type { SpkKasbonTargetTermin } from "@prisma/client";
import { normalizeKasbonNamaSupplier } from "../spk/kasbonNamaSupplier.js";
import { normalizeTukangMaritalForSave } from "../tukang/tukangMarital.js";
import type { SpkJenis } from "../entities/Spk.js";
import { resolveSpkTerminScheme, type SpkTerminSchemeKey } from "../spk/spkTerminScheme.js";
import {
  calcSpkPembayaranNominal,
  calcSisaNilaiKontrak,
  getKasbonTargetTermin,
  getPengurangTerminCapacity,
  getSpkTerminJenisForRecalc,
  getTerminPaymentStatus,
  isKasbonTargetTermin,
  validatePengurangTerminNominal,
  type SpkPembayaranCalcRow,
} from "../spk/spkPembayaranCalc.js";
import type { SpkPembayaranDokumenInput } from "../dtos/SpkPembayaranDTO.js";

function mapDokumenCreateFields(data: SpkPembayaranDokumenInput) {
  return {
    dokumenInvoice: data.dokumenInvoice ?? null,
    dokumenMaterial: data.dokumenMaterial ?? null,
    dokumenBeritaAcara: data.dokumenBeritaAcara ?? null,
    dokumenProgressSpk: data.dokumenProgressSpk ?? null,
  };
}

function mapRequiredKasbonDokumen(dokumen: {
  dokumenInvoice: string;
  dokumenMaterial: string;
}) {
  return {
    dokumenInvoice: dokumen.dokumenInvoice,
    dokumenMaterial: dokumen.dokumenMaterial,
    dokumenBeritaAcara: null,
    dokumenProgressSpk: null,
  };
}

function toCalcStatus(
  status: SpkPembayaranStatus,
): "MENUNGGU_PEMBAYARAN" | "SUDAH_DIBAYAR" {
  if (status === "SUDAH_DIBAYAR") {
    return "SUDAH_DIBAYAR";
  }
  return "MENUNGGU_PEMBAYARAN";
}

function isEditablePenguranganStatus(status: SpkPembayaranStatus): boolean {
  return (
    status === SpkPembayaranStatus.MENUNGGU_PEMBAYARAN ||
    status === SpkPembayaranStatus.MENUNGGU_PERSETUJUAN ||
    status === SpkPembayaranStatus.MENUNGGU_APPROVAL_ADMIN
  );
}

function toPengurangRowsFromDb(
  rows: {
    id: number;
    jenis: SpkPembayaranJenis;
    status: SpkPembayaranStatus;
    nominal: Prisma.Decimal;
    mengurangiTermin?: SpkKasbonTargetTermin | null;
  }[],
) {
  return rows
    .filter(
      (p) =>
        p.status !== SpkPembayaranStatus.DRAFT &&
        (p.jenis === "KASBON" || p.jenis === "UPAH"),
    )
    .map((p) => ({
      id: p.id,
      jenis: p.jenis,
      nominal: Number(p.nominal),
      mengurangiTermin: isKasbonTargetTermin(p.mengurangiTermin)
        ? p.mengurangiTermin
        : null,
    }));
}

function resolveKasbonTargetTermin(
  calcRows: SpkPembayaranCalcRow[],
  existingRows: {
    id: number;
    jenis: SpkPembayaranJenis;
    status: SpkPembayaranStatus;
    nominal: Prisma.Decimal;
    mengurangiTermin?: SpkKasbonTargetTermin | null;
  }[],
  nilaiKontrak: number,
  terminScheme: SpkTerminSchemeKey,
) {
  return getKasbonTargetTermin(calcRows, {
    nilaiKontrak,
    pengurangRows: toPengurangRowsFromDb(existingRows),
    terminScheme,
  });
}

function toCalcRows(
  rows: {
    id?: number;
    jenis: SpkPembayaranJenis;
    status: SpkPembayaranStatus;
    nominal: Prisma.Decimal;
    mengurangiTermin?: SpkKasbonTargetTermin | null;
    keterangan?: string | null;
  }[],
): SpkPembayaranCalcRow[] {
  // Draft tidak boleh mempengaruhi kalkulasi termin / plafon.
  return rows
    .filter((p) => p.status !== SpkPembayaranStatus.DRAFT)
    .map((p) => {
      const row: SpkPembayaranCalcRow = {
        jenis: p.jenis,
        status: toCalcStatus(p.status),
        nominal: Number(p.nominal),
        mengurangiTermin: isKasbonTargetTermin(p.mengurangiTermin)
          ? p.mengurangiTermin
          : null,
      };
      if (p.id !== undefined) row.id = p.id;
      if (p.keterangan !== undefined && p.keterangan !== null) {
        row.keterangan = p.keterangan;
      }
      return row;
    });
}

export class SpkPembayaranRepository implements ISpkPembayaranRepository {
  constructor(private readonly db: PrismaClient) {}

  private async resolveMandorRekeningId(
    tx: Prisma.TransactionClient,
    spkId: number,
    mandorRekeningId?: number,
  ): Promise<number | undefined> {
    const spk = await tx.spk.findUnique({
      where: { id: spkId },
      select: { mandorId: true },
    });
    if (!spk) throw new Error("SPK_NOT_FOUND");

    const mandor = await tx.mandor.findUnique({
      where: { userId: spk.mandorId },
      include: {
        rekeningList: {
          orderBy: [{ isDefault: "desc" }, { id: "asc" }],
        },
      },
    });
    if (!mandor?.rekeningList.length) return mandorRekeningId;

    if (mandor.rekeningList.length === 1) {
      return mandorRekeningId ?? mandor.rekeningList[0]!.id;
    }

    if (!mandorRekeningId) {
      const defaultRek =
        mandor.rekeningList.find((item) => item.isDefault) ??
        mandor.rekeningList[0]!;
      return defaultRek.id;
    }

    const selected = mandor.rekeningList.find((item) => item.id === mandorRekeningId);
    if (!selected) throw new Error("MANDOR_REKENING_INVALID");
    return selected.id;
  }

  private mandorRekeningConnect(mandorRekeningId?: number) {
    return mandorRekeningId
      ? { mandorRekening: { connect: { id: mandorRekeningId } } }
      : {};
  }

  private buildTukangMaritalData(barisItem: SpkPembayaranUpahBarisInput) {
    try {
      return normalizeTukangMaritalForSave(barisItem);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (
        msg === "TUKANG_JUMLAH_ANAK_REQUIRED" ||
        msg === "TUKANG_JUMLAH_ANAK_INVALID"
      ) {
        throw new Error("UPAH_BARIS_INVALID");
      }
      throw err;
    }
  }

  private async resolveUpahBaris(
    tx: Prisma.TransactionClient,
    baris: SpkPembayaranUpahBarisInput[],
    useTotalAtPaymentLevel = false,
    defaultMandorId?: number | null,
  ) {
    const resolved: {
      tukangId: number | null;
      nik: string;
      nama: string;
      nominal: number;
    }[] = [];

    for (const barisItem of baris) {
      const nik = barisItem.nik.trim();
      const nama = barisItem.nama.trim();
      const rowNominal = barisItem.nominal ?? 0;
      const maritalData = this.buildTukangMaritalData(barisItem);
      if (!nik || !nama) {
        throw new Error("UPAH_BARIS_INVALID");
      }
      if (!useTotalAtPaymentLevel && rowNominal <= 0) {
        throw new Error("UPAH_BARIS_INVALID");
      }

      if (barisItem.tukangId) {
        const existingTukang = await tx.tukang.findUnique({
          where: { id: barisItem.tukangId },
        });
        if (existingTukang) {
          const updateData: {
            nama: string;
            sudahMenikah?: boolean;
            jumlahAnak?: number;
          } = { nama };
          if (maritalData) {
            updateData.sudahMenikah = maritalData.sudahMenikah;
            updateData.jumlahAnak = maritalData.jumlahAnak;
          }
          if (
            existingTukang.nama !== nama ||
            (maritalData &&
              (existingTukang.sudahMenikah !== maritalData.sudahMenikah ||
                existingTukang.jumlahAnak !== maritalData.jumlahAnak))
          ) {
            await tx.tukang.update({
              where: { id: existingTukang.id },
              data: updateData,
            });
          }
          resolved.push({
            tukangId: existingTukang.id,
            nik: existingTukang.nik,
            nama,
            nominal: useTotalAtPaymentLevel ? 0 : rowNominal,
          });
          continue;
        }
      }

      const tukang = await tx.tukang.upsert({
        where: { nik },
        create: {
          nik,
          nama,
          ...(maritalData
            ? {
                sudahMenikah: maritalData.sudahMenikah,
                jumlahAnak: maritalData.jumlahAnak,
              }
            : {}),
          ...(defaultMandorId ? { mandorId: defaultMandorId } : {}),
        },
        update: {
          nama,
          ...(maritalData
            ? {
                sudahMenikah: maritalData.sudahMenikah,
                jumlahAnak: maritalData.jumlahAnak,
              }
            : {}),
          ...(defaultMandorId ? { mandorId: defaultMandorId } : {}),
        },
      });

      resolved.push({
        tukangId: tukang.id,
        nik: tukang.nik,
        nama: tukang.nama,
        nominal: useTotalAtPaymentLevel ? 0 : rowNominal,
      });
    }

    return resolved;
  }

  private normalizeKasbonBaris(baris: SpkPembayaranKasbonBarisInput[]) {
    const normalized: SpkPembayaranKasbonBarisInput[] = [];
    for (const item of baris) {
      const namaSupplier = normalizeKasbonNamaSupplier(item.namaSupplier);
      const keterangan = item.keterangan.trim();
      if (!keterangan || item.nominal <= 0) {
        throw new Error("KASBON_BARIS_INVALID");
      }
      normalized.push({
        namaSupplier,
        keterangan,
        tanggalPo: item.tanggalPo,
        nominal: item.nominal,
        fotoBon: item.fotoBon?.trim() || null,
      });
    }
    return normalized;
  }

  private summarizeKasbonBaris(baris: SpkPembayaranKasbonBarisInput[]) {
    const totalNominal = baris.reduce((sum, b) => sum + b.nominal, 0);
    const keterangan =
      baris.length === 1
        ? baris[0]!.keterangan
        : `Kasbon (${baris.length} item)`;
    const tanggalPo = baris.reduce(
      (earliest, b) => (b.tanggalPo < earliest ? b.tanggalPo : earliest),
      baris[0]!.tanggalPo,
    );
    return { totalNominal, keterangan, tanggalPo };
  }

  private hasBuktiPembayaran(row: {
    buktiPembayaran: string | null;
    buktiPembayaranList: Prisma.JsonValue | null;
  }): boolean {
    if (row.buktiPembayaran) return true;
    if (Array.isArray(row.buktiPembayaranList)) {
      return row.buktiPembayaranList.some((item) => typeof item === "string");
    }
    return false;
  }

  private async recalcPendingTerminNominals(
    tx: Prisma.TransactionClient,
    spkId: number,
    nilaiKontrak: number,
    terminScheme: SpkTerminSchemeKey,
    pembayaranRows: {
      id: number;
      jenis: SpkPembayaranJenis;
      status: SpkPembayaranStatus;
      nominal: Prisma.Decimal;
      mengurangiTermin: SpkKasbonTargetTermin | null;
      keterangan: string | null;
    }[],
  ) {
    const calcRows = toCalcRows(pembayaranRows);
    const spkInput = { nilaiKontrak };

    for (const jenis of getSpkTerminJenisForRecalc(terminScheme)) {
      const row = pembayaranRows.find(
        (p) =>
          p.jenis === jenis &&
          (p.status === SpkPembayaranStatus.MENUNGGU_PEMBAYARAN ||
            p.status === SpkPembayaranStatus.MENUNGGU_PERSETUJUAN ||
            p.status === SpkPembayaranStatus.MENUNGGU_APPROVAL_ADMIN),
      );
      if (!row) continue;

      const newNominal = calcSpkPembayaranNominal(
        jenis,
        spkInput,
        calcRows,
        terminScheme,
      );
      if (Number(row.nominal) !== newNominal) {
        await tx.spkPembayaran.update({
          where: { id: row.id },
          data: { nominal: new Prisma.Decimal(newNominal) },
        });
        row.nominal = new Prisma.Decimal(newNominal);
      }
    }
  }

  private async syncSpkNominals(
    tx: Prisma.TransactionClient,
    spkId: number,
  ) {
    const spk = await tx.spk.findUnique({ where: { id: spkId } });
    if (!spk) return;

    const pembayaranRows = await tx.spkPembayaran.findMany({
      where: { spkId },
      select: {
        id: true,
        jenis: true,
        status: true,
        nominal: true,
        mengurangiTermin: true,
        keterangan: true,
      },
    });

    const nilaiKontrak = Number(spk.nilaiKontrak);
    const terminScheme = resolveSpkTerminScheme({
      jenis: spk.jenis as SpkJenis,
      terminScheme: spk.terminScheme as SpkTerminSchemeKey,
    });

    await this.recalcPendingTerminNominals(
      tx,
      spkId,
      nilaiKontrak,
      terminScheme,
      pembayaranRows,
    );

    const refreshedRows = await tx.spkPembayaran.findMany({
      where: { spkId },
      select: {
        jenis: true,
        status: true,
        nominal: true,
        mengurangiTermin: true,
        keterangan: true,
      },
    });

    const refreshedCalc = toCalcRows(refreshedRows);
    const paidTotal = refreshedCalc
      .filter((p) => p.status === "SUDAH_DIBAYAR")
      .reduce((sum, p) => sum + p.nominal, 0);

    const sisaNilai = calcSisaNilaiKontrak(nilaiKontrak, refreshedCalc);

    await tx.spk.update({
      where: { id: spkId },
      data: {
        nilaiSudahDibayarkan: new Prisma.Decimal(paidTotal),
        sisaNilaiKontrak: new Prisma.Decimal(sisaNilai),
      },
    });
  }

  async findBySpkId(spkId: number): Promise<SpkPembayaranEntity[]> {
    // Draft kasbon mandor hanya diambil lewat findKasbonDraft — bukan daftar pengajuan.
    const rows = await this.db.spkPembayaran.findMany({
      where: {
        spkId,
        status: { not: SpkPembayaranStatus.DRAFT },
      },
      orderBy: [{ createdAt: "asc" }],
      include: SpkPembayaranMapper.include,
    });
    return rows.map((r) => SpkPembayaranMapper.toDomain(r));
  }

  async findById(id: number): Promise<SpkPembayaranEntity | null> {
    const row = await this.db.spkPembayaran.findUnique({
      where: { id },
      include: SpkPembayaranMapper.include,
    });
    if (!row) return null;
    return SpkPembayaranMapper.toDomain(row);
  }

  async findKasbonDraft(
    spkId: number,
    diajukanOlehId: number,
  ): Promise<SpkPembayaranEntity | null> {
    const row = await this.db.spkPembayaran.findFirst({
      where: {
        spkId,
        jenis: "KASBON",
        status: SpkPembayaranStatus.DRAFT,
        diajukanOlehId,
      },
      orderBy: [{ createdAt: "desc" }],
      include: SpkPembayaranMapper.include,
    });
    return row ? SpkPembayaranMapper.toDomain(row) : null;
  }

  async upsertKasbonDraft(
    spkId: number,
    diajukanOlehId: number,
    kasbonBaris: SpkPembayaranKasbonBarisInput[],
  ): Promise<SpkPembayaranEntity> {
    return await this.db.$transaction(async (tx) => {
      if (!kasbonBaris.length) throw new Error("KASBON_BARIS_EMPTY");

      const spk = await tx.spk.findUnique({
        where: { id: spkId },
        select: { id: true, nilaiKontrak: true, jenis: true, terminScheme: true, progressOverride: true },
      });
      if (!spk) throw new Error("SPK_NOT_FOUND");

      const existingRows = await tx.spkPembayaran.findMany({
        where: { spkId },
        select: {
          id: true,
          jenis: true,
          status: true,
          nominal: true,
          mengurangiTermin: true,
          keterangan: true,
        },
      });
      const calcRows = toCalcRows(existingRows);
      const nilaiKontrakDraft = Number(spk.nilaiKontrak);
      const terminScheme = resolveSpkTerminScheme({
      jenis: spk.jenis as SpkJenis,
      terminScheme: spk.terminScheme as SpkTerminSchemeKey,
    });
      const target = resolveKasbonTargetTermin(
        calcRows,
        existingRows,
        nilaiKontrakDraft,
        terminScheme,
      );
      if (!target) throw new Error("KASBON_NOT_ALLOWED");

      const normalizedBaris = this.normalizeKasbonBaris(kasbonBaris);
      const { totalNominal, keterangan, tanggalPo } =
        this.summarizeKasbonBaris(normalizedBaris);
      if (totalNominal <= 0) throw new Error("KASBON_NOMINAL_INVALID");

      const draft = await tx.spkPembayaran.findFirst({
        where: {
          spkId,
          jenis: "KASBON",
          status: SpkPembayaranStatus.DRAFT,
          diajukanOlehId,
        },
        orderBy: [{ createdAt: "desc" }],
        select: { id: true },
      });

      if (draft) {
        await tx.spkPembayaranKasbonBaris.deleteMany({
          where: { spkPembayaranId: draft.id },
        });

        const updated = await tx.spkPembayaran.update({
          where: { id: draft.id },
          data: {
            status: SpkPembayaranStatus.DRAFT,
            mengurangiTermin: target,
            nominal: new Prisma.Decimal(totalNominal),
            keterangan,
            tanggalPo,
            kasbonBaris: {
              create: normalizedBaris.map((b) => ({
                namaSupplier: b.namaSupplier,
                keterangan: b.keterangan,
                tanggalPo: b.tanggalPo,
                nominal: new Prisma.Decimal(b.nominal),
                fotoBon: b.fotoBon ?? null,
              })),
            },
          },
          include: SpkPembayaranMapper.include,
        });

        return SpkPembayaranMapper.toDomain(updated);
      }

      const created = await tx.spkPembayaran.create({
        data: {
          spk: { connect: { id: spkId } },
          jenis: "KASBON",
          status: SpkPembayaranStatus.DRAFT,
          mengurangiTermin: target,
          nominal: new Prisma.Decimal(totalNominal),
          keterangan,
          tanggalPo,
          diajukanOleh: { connect: { id: diajukanOlehId } },
          kasbonBaris: {
            create: normalizedBaris.map((b) => ({
              namaSupplier: b.namaSupplier,
              keterangan: b.keterangan,
              tanggalPo: b.tanggalPo,
              nominal: new Prisma.Decimal(b.nominal),
              fotoBon: b.fotoBon ?? null,
            })),
          },
        },
        include: SpkPembayaranMapper.include,
      });

      return SpkPembayaranMapper.toDomain(created);
    });
  }

  async submitKasbonDraft(
    spkId: number,
    diajukanOlehId: number,
    mandorRekeningId?: number,
    dokumen?: { dokumenInvoice: string; dokumenMaterial: string },
    spkProgress?: number,
  ): Promise<SpkPembayaranEntity> {
    return await this.db.$transaction(async (tx) => {
      const draft = await tx.spkPembayaran.findFirst({
        where: {
          spkId,
          jenis: "KASBON",
          status: SpkPembayaranStatus.DRAFT,
          diajukanOlehId,
        },
        include: { kasbonBaris: true },
        orderBy: [{ createdAt: "desc" }],
      });
      if (!draft) throw new Error("KASBON_DRAFT_NOT_FOUND");
      if (!draft.kasbonBaris.length) throw new Error("KASBON_BARIS_EMPTY");
      if (!dokumen?.dokumenInvoice || !dokumen.dokumenMaterial) {
        throw new Error("KASBON_DOKUMEN_REQUIRED");
      }

      const spk = await tx.spk.findUnique({
        where: { id: spkId },
        select: { id: true, nilaiKontrak: true, jenis: true, terminScheme: true, progressOverride: true },
      });
      if (!spk) throw new Error("SPK_NOT_FOUND");

      const existingRows = await tx.spkPembayaran.findMany({
        where: { spkId },
        select: {
          id: true,
          jenis: true,
          status: true,
          nominal: true,
          mengurangiTermin: true,
          keterangan: true,
        },
      });
      const calcRows = toCalcRows(existingRows);
      const terminSchemeDraft = resolveSpkTerminScheme({
        jenis: spk.jenis as SpkJenis,
        terminScheme: spk.terminScheme as SpkTerminSchemeKey,
      });
      const target = resolveKasbonTargetTermin(
        calcRows,
        existingRows,
        Number(spk.nilaiKontrak),
        terminSchemeDraft,
      );
      if (!target) throw new Error("KASBON_NOT_ALLOWED");

      const totalNominal = Number(draft.nominal);
      if (totalNominal <= 0) throw new Error("KASBON_NOMINAL_INVALID");

      const capRows = existingRows
        .filter((p) => p.status !== SpkPembayaranStatus.DRAFT && p.id !== draft.id)
        .map((p) => ({
          id: p.id,
          jenis: p.jenis,
          nominal: Number(p.nominal),
          mengurangiTermin: p.mengurangiTermin,
        }));

      const capCheck = validatePengurangTerminNominal(
        Number(spk.nilaiKontrak),
        capRows,
        target,
        totalNominal,
        undefined,
        getTerminPaymentStatus(calcRows, resolveSpkTerminScheme({
          jenis: spk.jenis as SpkJenis,
          terminScheme: spk.terminScheme as SpkTerminSchemeKey,
        })),
        resolveSpkTerminScheme({
          jenis: spk.jenis as SpkJenis,
          terminScheme: spk.terminScheme as SpkTerminSchemeKey,
        }),
        spkProgress,
      );
      if (!capCheck.allowed) throw new Error("KASBON_OVER_CAP");

      const resolvedRekeningId = await this.resolveMandorRekeningId(
        tx,
        spkId,
        mandorRekeningId,
      );

      // Buat pengajuan baru — jangan ubah status draft in-place agar pengajuan
      // sebelumnya (MENUNGGU/SUDAH_DIBAYAR) tidak tertimpa saat ajukan kasbon lagi.
      const submitted = await tx.spkPembayaran.create({
        data: {
          spk: { connect: { id: spkId } },
          jenis: "KASBON",
          status: SpkPembayaranStatus.MENUNGGU_PERSETUJUAN,
          mengurangiTermin: target,
          nominal: draft.nominal,
          keterangan: draft.keterangan,
          tanggalPo: draft.tanggalPo,
          diajukanOleh: { connect: { id: diajukanOlehId } },
          ...this.mandorRekeningConnect(resolvedRekeningId),
          ...mapRequiredKasbonDokumen({
            dokumenInvoice: dokumen!.dokumenInvoice,
            dokumenMaterial: dokumen!.dokumenMaterial,
          }),
          kasbonBaris: {
            create: draft.kasbonBaris.map((b) => ({
              namaSupplier: b.namaSupplier,
              keterangan: b.keterangan,
              tanggalPo: b.tanggalPo,
              nominal: b.nominal,
              fotoBon: b.fotoBon,
            })),
          },
        },
        include: SpkPembayaranMapper.include,
      });

      await tx.spkPembayaran.delete({ where: { id: draft.id } });

      await this.syncSpkNominals(tx, spkId);

      return SpkPembayaranMapper.toDomain(submitted);
    });
  }

  async createRequest(data: CreateSpkPembayaranDTO): Promise<SpkPembayaranEntity> {
    return await this.db.$transaction(async (tx) => {
      const spk = await tx.spk.findUnique({
        where: { id: data.spkId },
        select: { id: true, nilaiKontrak: true, jenis: true, terminScheme: true },
      });
      if (!spk) throw new Error("SPK_NOT_FOUND");

      const existingRows = await tx.spkPembayaran.findMany({
        where: { spkId: data.spkId },
        select: {
          id: true,
          jenis: true,
          status: true,
          nominal: true,
          mengurangiTermin: true,
          keterangan: true,
        },
      });

      const calcRows = toCalcRows(existingRows);
      const nilaiKontrak = Number(spk.nilaiKontrak);
      const terminScheme = resolveSpkTerminScheme({
      jenis: spk.jenis as SpkJenis,
      terminScheme: spk.terminScheme as SpkTerminSchemeKey,
    });
      const resolvedRekeningId = await this.resolveMandorRekeningId(
        tx,
        data.spkId,
        data.mandorRekeningId,
      );
      const rekeningConnect = this.mandorRekeningConnect(resolvedRekeningId);

      let createData: Prisma.SpkPembayaranCreateInput;

      if (data.jenis === "KASBON") {
        const target = resolveKasbonTargetTermin(
          calcRows,
          existingRows,
          nilaiKontrak,
          terminScheme,
        );
        if (!target) throw new Error("KASBON_NOT_ALLOWED");

        if (data.kasbonBaris?.length) {
          const normalizedBaris = this.normalizeKasbonBaris(data.kasbonBaris);
          const { totalNominal, keterangan, tanggalPo } =
            this.summarizeKasbonBaris(normalizedBaris);
          if (totalNominal <= 0) throw new Error("KASBON_NOMINAL_INVALID");

          createData = {
            spk: { connect: { id: data.spkId } },
            jenis: "KASBON",
            status: SpkPembayaranStatus.MENUNGGU_PERSETUJUAN,
            nominal: new Prisma.Decimal(totalNominal),
            keterangan,
            tanggalPo,
            mengurangiTermin: target,
            diajukanOleh: { connect: { id: data.diajukanOlehId } },
            kasbonBaris: {
              create: normalizedBaris.map((b) => ({
                namaSupplier: b.namaSupplier,
                keterangan: b.keterangan,
                tanggalPo: b.tanggalPo,
                nominal: new Prisma.Decimal(b.nominal),
                fotoBon: b.fotoBon ?? null,
              })),
            },
          };
        } else {
          const keterangan = data.keterangan?.trim() ?? "";
          const nominal = data.nominal ?? 0;
          if (!keterangan || nominal <= 0 || !data.tanggalPo) {
            throw new Error("KASBON_BARIS_INVALID");
          }

          createData = {
            spk: { connect: { id: data.spkId } },
            jenis: "KASBON",
            status: SpkPembayaranStatus.MENUNGGU_PERSETUJUAN,
            nominal: new Prisma.Decimal(nominal),
            keterangan,
            tanggalPo: data.tanggalPo,
            mengurangiTermin: target,
            diajukanOleh: { connect: { id: data.diajukanOlehId } },
          };
        }
      } else if (data.jenis === "UPAH") {
        const target = resolveKasbonTargetTermin(
          calcRows,
          existingRows,
          nilaiKontrak,
          terminScheme,
        );
        if (!target) throw new Error("UPAH_NOT_ALLOWED");
        if (!data.baris.length) throw new Error("UPAH_BARIS_EMPTY");

        const spkMandor = await tx.spk.findUnique({
          where: { id: data.spkId },
          select: { mandorId: true },
        });
        const resolvedBaris = await this.resolveUpahBaris(
          tx,
          data.baris,
          true,
          spkMandor?.mandorId ?? null,
        );
        const totalNominal = data.nominal;
        if (totalNominal <= 0) throw new Error("UPAH_NOMINAL_INVALID");

        createData = {
          spk: { connect: { id: data.spkId } },
          jenis: "UPAH",
          status: SpkPembayaranStatus.MENUNGGU_PERSETUJUAN,
          nominal: new Prisma.Decimal(totalNominal),
          tanggalDari: data.tanggalDari,
          tanggalSampai: data.tanggalSampai,
          mengurangiTermin: target,
          diajukanOleh: { connect: { id: data.diajukanOlehId } },
          upahBaris: {
            create: resolvedBaris.map((b) => ({
              tukangId: b.tukangId,
              nik: b.nik,
              nama: b.nama,
              nominal: new Prisma.Decimal(b.nominal),
            })),
          },
        };
      } else {
        if (existingRows.some((p) => p.jenis === data.jenis)) {
          throw new Error("PEMBAYARAN_JENIS_EXISTS");
        }

        const nominal = calcSpkPembayaranNominal(
          data.jenis,
          { nilaiKontrak },
          calcRows,
          terminScheme,
        );

        createData = {
          spk: { connect: { id: data.spkId } },
          jenis: data.jenis,
          status: SpkPembayaranStatus.MENUNGGU_PERSETUJUAN,
          nominal: new Prisma.Decimal(nominal),
          diajukanOleh: { connect: { id: data.diajukanOlehId } },
        };
      }

      createData = { ...createData, ...rekeningConnect, ...mapDokumenCreateFields(data) };

      const result = await tx.spkPembayaran.create({
        data: createData,
        include: SpkPembayaranMapper.include,
      });

      // Hapus draft kasbon mandor setelah pengajuan material terkirim ke finance.
      if (data.jenis === "KASBON") {
        await tx.spkPembayaran.deleteMany({
          where: {
            spkId: data.spkId,
            jenis: "KASBON",
            status: SpkPembayaranStatus.DRAFT,
            diajukanOlehId: data.diajukanOlehId,
          },
        });
      }

      const allRows = await tx.spkPembayaran.findMany({
        where: { spkId: data.spkId },
        select: {
          id: true,
          jenis: true,
          status: true,
          nominal: true,
          mengurangiTermin: true,
          keterangan: true,
        },
      });

      await this.recalcPendingTerminNominals(
        tx,
        data.spkId,
        nilaiKontrak,
        terminScheme,
        allRows,
      );

      await this.syncSpkNominals(tx, data.spkId);

      return SpkPembayaranMapper.toDomain(result);
    });
  }

  async createRequestWithSync(
    data: CreateSpkPembayaranDTO,
  ): Promise<SpkPembayaranEntity> {
    return await this.createRequest(data);
  }

  async markAsPaid(data: BayarSpkPembayaranDTO): Promise<SpkPembayaranEntity> {
    return await this.db.$transaction(async (tx) => {
      const existing = await tx.spkPembayaran.findUnique({
        where: { id: data.id },
      });
      if (!existing) throw new Error("SPK_PEMBAYARAN_NOT_FOUND");
      if (existing.status === SpkPembayaranStatus.DRAFT) {
        throw new Error("IS_DRAFT");
      }
      if (existing.status !== SpkPembayaranStatus.MENUNGGU_PEMBAYARAN) {
        throw new Error("ALREADY_PAID");
      }

      const result = await tx.spkPembayaran.update({
        where: { id: data.id },
        data: {
          status: SpkPembayaranStatus.SUDAH_DIBAYAR,
          buktiPembayaran: data.buktiPembayaran,
          buktiPembayaranList: data.buktiPembayaranList,
          tanggalPembayaran: data.tanggalPembayaran ?? new Date(),
          dibayarOlehId: data.dibayarOlehId,
        },
        include: SpkPembayaranMapper.include,
      });

      await this.syncSpkNominals(tx, existing.spkId);

      return SpkPembayaranMapper.toDomain(result);
    });
  }

  async markAsPaidWithSync(
    data: BayarSpkPembayaranDTO,
  ): Promise<SpkPembayaranEntity> {
    return await this.markAsPaid(data);
  }

  async addBuktiPembayaran(
    data: AddBuktiSpkPembayaranDTO,
  ): Promise<SpkPembayaranEntity> {
    return await this.db.$transaction(async (tx) => {
      const existing = await tx.spkPembayaran.findUnique({
        where: { id: data.id },
      });
      if (!existing) throw new Error("SPK_PEMBAYARAN_NOT_FOUND");

      const currentList = Array.isArray(existing.buktiPembayaranList)
        ? existing.buktiPembayaranList.filter((item): item is string => typeof item === "string")
        : existing.buktiPembayaran
          ? [existing.buktiPembayaran]
          : [];

      const mergedList = [...currentList, ...data.buktiPembayaranList];
      const nextFirst = mergedList[0] ?? null;

      const result = await tx.spkPembayaran.update({
        where: { id: data.id },
        data: {
          buktiPembayaran: nextFirst,
          buktiPembayaranList: mergedList,
        },
        include: SpkPembayaranMapper.include,
      });

      return SpkPembayaranMapper.toDomain(result);
    });
  }

  async removeBuktiPembayaran(
    data: RemoveBuktiSpkPembayaranDTO,
  ): Promise<SpkPembayaranEntity> {
    return await this.db.$transaction(async (tx) => {
      const existing = await tx.spkPembayaran.findUnique({
        where: { id: data.id },
      });
      if (!existing) throw new Error("SPK_PEMBAYARAN_NOT_FOUND");

      const currentList = Array.isArray(existing.buktiPembayaranList)
        ? existing.buktiPembayaranList.filter((item): item is string => typeof item === "string")
        : existing.buktiPembayaran
          ? [existing.buktiPembayaran]
          : [];

      if (!currentList.includes(data.buktiUrl)) {
        throw new Error("BUKTI_NOT_FOUND");
      }
      if (currentList.length <= 1) {
        throw new Error("MIN_ONE_BUKTI_REQUIRED");
      }

      const nextList = currentList.filter((url) => url !== data.buktiUrl);
      const nextFirst = nextList[0] ?? null;

      const result = await tx.spkPembayaran.update({
        where: { id: data.id },
        data: {
          buktiPembayaran: nextFirst,
          buktiPembayaranList: nextList,
        },
        include: SpkPembayaranMapper.include,
      });

      return SpkPembayaranMapper.toDomain(result);
    });
  }

  async syncSpkNominalsForSpk(spkId: number): Promise<void> {
    await this.db.$transaction(async (tx) => {
      await this.syncSpkNominals(tx, spkId);
    });
  }

  async findPaginated(
    page: number,
    limit: number,
    filters?: SpkPembayaranFilterDTO,
  ): Promise<OffsetPaginatedData<SpkPembayaranEntity>> {
    // Halaman finance (Bayar SPK): hanya pengajuan yang sudah diajukan mandor.
    // Draft = bon dikumpulkan mandor, belum ke finance.
    const where: Prisma.SpkPembayaranWhereInput = {
      status:
        filters?.status === SpkPembayaranStatus.MENUNGGU_PEMBAYARAN ||
        filters?.status === SpkPembayaranStatus.MENUNGGU_PERSETUJUAN ||
        filters?.status === SpkPembayaranStatus.MENUNGGU_APPROVAL_ADMIN ||
        filters?.status === SpkPembayaranStatus.SUDAH_DIBAYAR
          ? filters.status
          : {
              in: [
                SpkPembayaranStatus.MENUNGGU_PERSETUJUAN,
                SpkPembayaranStatus.MENUNGGU_APPROVAL_ADMIN,
                SpkPembayaranStatus.MENUNGGU_PEMBAYARAN,
                SpkPembayaranStatus.SUDAH_DIBAYAR,
              ],
            },
    };
    if (filters?.spkId) where.spkId = filters.spkId;
    if (filters?.jenis) where.jenis = filters.jenis;
    if (filters?.bankRekeningPtId) {
      where.spk = { bankRekeningPtId: filters.bankRekeningPtId };
    }

    const andConditions: Prisma.SpkPembayaranWhereInput[] = [];

    if (filters?.search) {
      andConditions.push({
        OR: [
          { spk: { noSpk: { contains: filters.search } } },
          { spk: { judulPekerjaan: { contains: filters.search } } },
          { spk: { mandor: { username: { contains: filters.search } } } },
          { keterangan: { contains: filters.search } },
        ],
      });
    }

    if (filters?.bulan && filters?.tahun) {
      const periodStart = new Date(filters.tahun, filters.bulan - 1, 1);
      const periodEnd = new Date(filters.tahun, filters.bulan, 0, 23, 59, 59, 999);
      andConditions.push({
        OR: [
          {
            AND: [
              { tanggalDari: { lte: periodEnd } },
              { tanggalSampai: { gte: periodStart } },
            ],
          },
          {
            AND: [
              { tanggalDari: null },
              { createdAt: { gte: periodStart, lte: periodEnd } },
            ],
          },
        ],
      });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    const skip = (page - 1) * limit;
    const [totalItems, rows] = await Promise.all([
      this.db.spkPembayaran.count({ where }),
      this.db.spkPembayaran.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ spkId: "asc" }, { createdAt: "asc" }],
        include: SpkPembayaranMapper.include,
      }),
    ]);

    const totalPages = Math.ceil(totalItems / limit) || 1;

    return {
      items: rows.map((r) => SpkPembayaranMapper.toDomain(r)),
      meta: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  async updateKasbon(
    data: UpdateSpkKasbonDTO,
    options?: { force?: boolean },
  ): Promise<SpkPembayaranEntity> {
    const force = options?.force === true;
    return await this.db.$transaction(async (tx) => {
      const existing = await tx.spkPembayaran.findUnique({
        where: { id: data.id },
        include: { kasbonBaris: { select: { id: true } } },
      });
      if (!existing) throw new Error("SPK_PEMBAYARAN_NOT_FOUND");
      if (existing.jenis !== "KASBON") throw new Error("NOT_KASBON");
      if (!force) {
        if (!isEditablePenguranganStatus(existing.status)) {
          throw new Error("ALREADY_PAID");
        }
        if (this.hasBuktiPembayaran(existing)) throw new Error("HAS_BUKTI");
      }

      const isBatchRecord = existing.kasbonBaris.length > 0;

      if ("kasbonBaris" in data) {
        if (!isBatchRecord) throw new Error("LEGACY_KASBON_EDIT");
        if (!data.kasbonBaris.length) throw new Error("KASBON_BARIS_EMPTY");

        const normalizedBaris = this.normalizeKasbonBaris(data.kasbonBaris);
        const { totalNominal, keterangan, tanggalPo } =
          this.summarizeKasbonBaris(normalizedBaris);
        if (totalNominal <= 0) throw new Error("KASBON_NOMINAL_INVALID");

        await tx.spkPembayaranKasbonBaris.deleteMany({
          where: { spkPembayaranId: data.id },
        });

        const result = await tx.spkPembayaran.update({
          where: { id: data.id },
          data: {
            keterangan,
            tanggalPo,
            nominal: new Prisma.Decimal(totalNominal),
            kasbonBaris: {
              create: normalizedBaris.map((b) => ({
                namaSupplier: b.namaSupplier,
                keterangan: b.keterangan,
                tanggalPo: b.tanggalPo,
                nominal: new Prisma.Decimal(b.nominal),
                fotoBon: b.fotoBon ?? null,
              })),
            },
          },
          include: SpkPembayaranMapper.include,
        });

        await this.syncSpkNominals(tx, existing.spkId);
        return SpkPembayaranMapper.toDomain(result);
      }

      if (isBatchRecord) throw new Error("BATCH_KASBON_EDIT");

      const result = await tx.spkPembayaran.update({
        where: { id: data.id },
        data: {
          keterangan: data.keterangan,
          tanggalPo: data.tanggalPo,
          nominal: new Prisma.Decimal(data.nominal),
        },
        include: SpkPembayaranMapper.include,
      });

      await this.syncSpkNominals(tx, existing.spkId);

      return SpkPembayaranMapper.toDomain(result);
    });
  }

  async updateUpah(
    data: UpdateSpkUpahDTO,
    options?: { force?: boolean },
  ): Promise<SpkPembayaranEntity> {
    const force = options?.force === true;
    return await this.db.$transaction(async (tx) => {
      const existing = await tx.spkPembayaran.findUnique({
        where: { id: data.id },
      });
      if (!existing) throw new Error("SPK_PEMBAYARAN_NOT_FOUND");
      if (existing.jenis !== "UPAH") throw new Error("NOT_UPAH");
      if (!force) {
        if (!isEditablePenguranganStatus(existing.status)) {
          throw new Error("ALREADY_PAID");
        }
        if (this.hasBuktiPembayaran(existing)) throw new Error("HAS_BUKTI");
      }
      if (!data.baris.length) throw new Error("UPAH_BARIS_EMPTY");

      const pembayaranSpk = await tx.spkPembayaran.findUnique({
        where: { id: data.id },
        select: { spk: { select: { mandorId: true } } },
      });
      const resolvedBaris = await this.resolveUpahBaris(
        tx,
        data.baris,
        true,
        pembayaranSpk?.spk.mandorId ?? null,
      );
      const totalNominal = data.nominal;
      if (totalNominal <= 0) throw new Error("UPAH_NOMINAL_INVALID");

      await tx.spkPembayaranUpahBaris.deleteMany({
        where: { spkPembayaranId: data.id },
      });

      const result = await tx.spkPembayaran.update({
        where: { id: data.id },
        data: {
          tanggalDari: data.tanggalDari,
          tanggalSampai: data.tanggalSampai,
          nominal: new Prisma.Decimal(totalNominal),
          upahBaris: {
            create: resolvedBaris.map((b) => ({
              tukangId: b.tukangId,
              nik: b.nik,
              nama: b.nama,
              nominal: new Prisma.Decimal(b.nominal),
            })),
          },
        },
        include: SpkPembayaranMapper.include,
      });

      await this.syncSpkNominals(tx, existing.spkId);

      return SpkPembayaranMapper.toDomain(result);
    });
  }

  async deletePengurangan(id: number): Promise<void> {
    await this.db.$transaction(async (tx) => {
      const existing = await tx.spkPembayaran.findUnique({
        where: { id },
      });
      if (!existing) throw new Error("SPK_PEMBAYARAN_NOT_FOUND");
      if (existing.jenis !== "KASBON" && existing.jenis !== "UPAH") {
        throw new Error("NOT_DELETABLE");
      }
      if (
        existing.status !== SpkPembayaranStatus.MENUNGGU_PEMBAYARAN &&
        existing.status !== SpkPembayaranStatus.MENUNGGU_PERSETUJUAN &&
        existing.status !== SpkPembayaranStatus.MENUNGGU_APPROVAL_ADMIN &&
        existing.status !== SpkPembayaranStatus.DRAFT
      ) {
        throw new Error("ALREADY_PAID");
      }
      if (this.hasBuktiPembayaran(existing)) throw new Error("HAS_BUKTI");

      await tx.spkPembayaran.delete({ where: { id } });

      await this.syncSpkNominals(tx, existing.spkId);
    });
  }

  async forceDeletePembayaran(id: number): Promise<void> {
    await this.db.$transaction(async (tx) => {
      const existing = await tx.spkPembayaran.findUnique({
        where: { id },
      });
      if (!existing) throw new Error("SPK_PEMBAYARAN_NOT_FOUND");

      await tx.spkPembayaran.delete({ where: { id } });
      await this.syncSpkNominals(tx, existing.spkId);
    });
  }

  async approvePengajuan(
    id: number,
    disetujuiOlehId: number,
    userRole: Role,
  ): Promise<SpkPembayaranEntity> {
    return await this.db.$transaction(async (tx) => {
      const existing = await tx.spkPembayaran.findUnique({
        where: { id },
      });
      if (!existing) throw new Error("SPK_PEMBAYARAN_NOT_FOUND");

      const isPengawasStep =
        existing.status === SpkPembayaranStatus.MENUNGGU_PERSETUJUAN &&
        (userRole === Role.PENGAWAS || userRole === Role.SUPERADMIN);

      const isAdminStep =
        existing.status === SpkPembayaranStatus.MENUNGGU_APPROVAL_ADMIN &&
        (userRole === Role.ADMIN || userRole === Role.SUPERADMIN);

      if (!isPengawasStep && !isAdminStep) {
        throw new Error("NOT_PENDING_APPROVAL");
      }

      const nextStatus = isPengawasStep
        ? SpkPembayaranStatus.MENUNGGU_APPROVAL_ADMIN
        : SpkPembayaranStatus.MENUNGGU_PEMBAYARAN;

      const result = await tx.spkPembayaran.update({
        where: { id },
        data: isAdminStep
          ? {
              status: nextStatus,
              disetujuiOleh: { connect: { id: disetujuiOlehId } },
              tanggalDisetujui: new Date(),
            }
          : { status: nextStatus },
        include: SpkPembayaranMapper.include,
      });

      return SpkPembayaranMapper.toDomain(result);
    });
  }

  async setBsiCmsDilaporkan(
    data: SetBsiCmsDilaporkanDTO,
  ): Promise<SpkPembayaranEntity[]> {
    const uniqueIds = [...new Set(data.ids)];
    if (uniqueIds.length === 0) return [];

    const draftCount = await this.db.spkPembayaran.count({
      where: { id: { in: uniqueIds }, status: SpkPembayaranStatus.DRAFT },
    });
    if (draftCount > 0) throw new Error("CONTAINS_DRAFT");

    await this.db.spkPembayaran.updateMany({
      where: { id: { in: uniqueIds }, status: { not: SpkPembayaranStatus.DRAFT } },
      data: {
        bsiCmsDilaporkan: data.dilaporkan,
        bsiCmsDilaporkanAt: data.dilaporkan ? new Date() : null,
      },
    });

    const rows = await this.db.spkPembayaran.findMany({
      where: { id: { in: uniqueIds } },
      include: SpkPembayaranMapper.include,
      orderBy: [{ id: "asc" }],
    });

    return rows.map((r) => SpkPembayaranMapper.toDomain(r));
  }
}
