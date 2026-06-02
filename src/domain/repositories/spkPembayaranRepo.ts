import {
  Prisma,
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
} from "../dtos/SpkPembayaranDTO.js";
import type { SpkPembayaranEntity } from "../entities/SpkPembayaran.js";
import type { OffsetPaginatedData } from "../../types/response.js";
import { SpkPembayaranMapper } from "../../infrastructure/mapper/SpkPembayaranMapper.js";
import type { SpkKasbonTargetTermin } from "@prisma/client";
import {
  calcSpkPembayaranNominal,
  calcSisaNilaiKontrak,
  getKasbonTargetTermin,
  type SpkPembayaranCalcRow,
} from "../spk/spkPembayaranCalc.js";

const TERMIN_JENIS: SpkPembayaranJenis[] = ["TERMIN_55", "TERMIN_100", "RETENSI"];

function toCalcRows(
  rows: {
    jenis: SpkPembayaranJenis;
    status: SpkPembayaranStatus;
    nominal: Prisma.Decimal;
    mengurangiTermin?: SpkKasbonTargetTermin | null;
    keterangan?: string | null;
  }[],
): SpkPembayaranCalcRow[] {
  return rows.map((p) => ({
    jenis: p.jenis,
    status: p.status,
    nominal: Number(p.nominal),
    mengurangiTermin:
      p.mengurangiTermin === "TERMIN_55" || p.mengurangiTermin === "TERMIN_100"
        ? p.mengurangiTermin
        : null,
    keterangan: p.keterangan ?? null,
  }));
}

export class SpkPembayaranRepository implements ISpkPembayaranRepository {
  constructor(private readonly db: PrismaClient) {}

  private async recalcPendingTerminNominals(
    tx: Prisma.TransactionClient,
    spkId: number,
    nilaiKontrak: number,
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

    for (const jenis of TERMIN_JENIS) {
      const row = pembayaranRows.find(
        (p) => p.jenis === jenis && p.status === SpkPembayaranStatus.MENUNGGU_PEMBAYARAN,
      );
      if (!row) continue;

      const newNominal = calcSpkPembayaranNominal(jenis, spkInput, calcRows);
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

    await this.recalcPendingTerminNominals(
      tx,
      spkId,
      nilaiKontrak,
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
    const rows = await this.db.spkPembayaran.findMany({
      where: { spkId },
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

  async createRequest(data: CreateSpkPembayaranDTO): Promise<SpkPembayaranEntity> {
    return await this.db.$transaction(async (tx) => {
      const spk = await tx.spk.findUnique({
        where: { id: data.spkId },
        select: { id: true, nilaiKontrak: true },
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

      let createData: Prisma.SpkPembayaranCreateInput;

      if (data.jenis === "KASBON") {
        const target = getKasbonTargetTermin(calcRows);
        if (!target) throw new Error("KASBON_NOT_ALLOWED");

        createData = {
          spk: { connect: { id: data.spkId } },
          jenis: "KASBON",
          nominal: new Prisma.Decimal(data.nominal),
          keterangan: data.keterangan,
          tanggalPo: data.tanggalPo,
          mengurangiTermin: target,
          diajukanOleh: { connect: { id: data.diajukanOlehId } },
        };
      } else {
        if (existingRows.some((p) => p.jenis === data.jenis)) {
          throw new Error("PEMBAYARAN_JENIS_EXISTS");
        }

        const nominal = calcSpkPembayaranNominal(
          data.jenis,
          { nilaiKontrak },
          calcRows,
        );

        createData = {
          spk: { connect: { id: data.spkId } },
          jenis: data.jenis,
          nominal: new Prisma.Decimal(nominal),
          diajukanOleh: { connect: { id: data.diajukanOlehId } },
        };
      }

      const result = await tx.spkPembayaran.create({
        data: createData,
        include: SpkPembayaranMapper.include,
      });

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
    const where: Prisma.SpkPembayaranWhereInput = {};

    if (filters?.status) where.status = filters.status;
    if (filters?.spkId) where.spkId = filters.spkId;
    if (filters?.search) {
      where.OR = [
        { spk: { noSpk: { contains: filters.search } } },
        { spk: { judulPekerjaan: { contains: filters.search } } },
        { spk: { mandor: { username: { contains: filters.search } } } },
        { keterangan: { contains: filters.search } },
      ];
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

  async updateKasbon(data: UpdateSpkKasbonDTO): Promise<SpkPembayaranEntity> {
    return await this.db.$transaction(async (tx) => {
      const existing = await tx.spkPembayaran.findUnique({
        where: { id: data.id },
      });
      if (!existing) throw new Error("SPK_PEMBAYARAN_NOT_FOUND");
      if (existing.jenis !== "KASBON") throw new Error("NOT_KASBON");
      if (existing.status !== SpkPembayaranStatus.MENUNGGU_PEMBAYARAN) {
        throw new Error("ALREADY_PAID");
      }
      if (existing.buktiPembayaran) throw new Error("HAS_BUKTI");

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

  async setBsiCmsDilaporkan(
    data: SetBsiCmsDilaporkanDTO,
  ): Promise<SpkPembayaranEntity[]> {
    const uniqueIds = [...new Set(data.ids)];
    if (uniqueIds.length === 0) return [];

    await this.db.spkPembayaran.updateMany({
      where: { id: { in: uniqueIds } },
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
