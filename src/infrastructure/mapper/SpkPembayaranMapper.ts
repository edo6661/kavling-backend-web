import type { Prisma } from "@prisma/client";
import type { SpkPembayaranEntity } from "../../domain/entities/SpkPembayaran.js";
import { normalizeKasbonNamaSupplier } from "../../domain/spk/kasbonNamaSupplier.js";

export const spkPembayaranInclude = {
  diajukanOleh: { select: { id: true, username: true } },
  disetujuiOleh: { select: { id: true, username: true } },
  dibayarOleh: { select: { id: true, username: true } },
  mandorRekening: {
    select: {
      id: true,
      label: true,
      namaBank: true,
      noRekening: true,
      atasNamaRekening: true,
      isDefault: true,
    },
  },
  upahBaris: {
    orderBy: { id: "asc" as const },
    select: {
      id: true,
      spkPembayaranId: true,
      tukangId: true,
      nik: true,
      nama: true,
      nominal: true,
    },
  },
  kasbonBaris: {
    orderBy: { id: "asc" as const },
    select: {
      id: true,
      spkPembayaranId: true,
      namaSupplier: true,
      keterangan: true,
      tanggalPo: true,
      nominal: true,
      fotoBon: true,
    },
  },
  spk: {
    select: {
      id: true,
      noSpk: true,
      judulPekerjaan: true,
      nilaiKontrak: true,
      bankRekeningPt: {
        select: {
          id: true,
          namaBank: true,
          noRekening: true,
          atasNama: true,
        },
      },
      mandor: {
        select: {
          id: true,
          username: true,
          mandorProfile: {
            select: {
              namaBank: true,
              noRekening: true,
              atasNamaRekening: true,
            },
          },
        },
      },
    },
  },
} satisfies Prisma.SpkPembayaranInclude;

export type SpkPembayaranWithRelations = Prisma.SpkPembayaranGetPayload<{
  include: typeof spkPembayaranInclude;
}>;

export class SpkPembayaranMapper {
  static readonly include = spkPembayaranInclude;

  private static normalizeBuktiPembayaranList(
    buktiPembayaranList: Prisma.JsonValue | null,
    buktiPembayaran: string | null,
  ): string[] {
    if (Array.isArray(buktiPembayaranList)) {
      return buktiPembayaranList.filter((item): item is string => typeof item === "string");
    }
    return buktiPembayaran ? [buktiPembayaran] : [];
  }

  static toDomain(row: SpkPembayaranWithRelations): SpkPembayaranEntity {
    const buktiPembayaranList = this.normalizeBuktiPembayaranList(
      row.buktiPembayaranList,
      row.buktiPembayaran,
    );
    const mandorRekening = row.mandorRekening
      ? {
          id: row.mandorRekening.id,
          label: row.mandorRekening.label,
          namaBank: row.mandorRekening.namaBank,
          noRekening: row.mandorRekening.noRekening,
          atasNamaRekening: row.mandorRekening.atasNamaRekening,
          isDefault: row.mandorRekening.isDefault,
        }
      : null;

    const entity: SpkPembayaranEntity = {
      id: row.id,
      spkId: row.spkId,
      jenis: row.jenis,
      nominal: Number(row.nominal),
      keterangan: row.keterangan,
      tanggalPo: row.tanggalPo,
      tanggalDari: row.tanggalDari,
      tanggalSampai: row.tanggalSampai,
      mengurangiTermin: row.mengurangiTermin,
      upahBaris: row.upahBaris?.map((b) => ({
        id: b.id,
        spkPembayaranId: b.spkPembayaranId,
        tukangId: b.tukangId,
        nik: b.nik,
        nama: b.nama,
        nominal: Number(b.nominal),
      })),
      kasbonBaris: row.kasbonBaris?.map((b) => ({
        id: b.id,
        spkPembayaranId: b.spkPembayaranId,
        namaSupplier: normalizeKasbonNamaSupplier(b.namaSupplier),
        keterangan: b.keterangan,
        tanggalPo: b.tanggalPo,
        nominal: Number(b.nominal),
        fotoBon: b.fotoBon,
      })),
      status: row.status,
      buktiPembayaran: row.buktiPembayaran,
      buktiPembayaranList,
      dokumenInvoice: row.dokumenInvoice,
      dokumenMaterial: row.dokumenMaterial,
      dokumenBeritaAcara: row.dokumenBeritaAcara,
      dokumenProgressSpk: row.dokumenProgressSpk,
      tanggalPembayaran: row.tanggalPembayaran,
      bsiCmsDilaporkan: row.bsiCmsDilaporkan,
      bsiCmsDilaporkanAt: row.bsiCmsDilaporkanAt,
      diajukanOlehId: row.diajukanOlehId,
      disetujuiOlehId: row.disetujuiOlehId,
      tanggalDisetujui: row.tanggalDisetujui,
      dibayarOlehId: row.dibayarOlehId,
      mandorRekeningId: row.mandorRekeningId,
      mandorRekening,
      diajukanOleh: row.diajukanOleh,
      disetujuiOleh: row.disetujuiOleh,
      dibayarOleh: row.dibayarOleh,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };

    if (row.spk) {
      const profileBank = row.spk.mandor.mandorProfile;
      const transferBank = mandorRekening ?? profileBank;
      entity.spk = {
        id: row.spk.id,
        noSpk: row.spk.noSpk,
        judulPekerjaan: row.spk.judulPekerjaan,
        nilaiKontrak: Number(row.spk.nilaiKontrak),
        bankRekeningPt: row.spk.bankRekeningPt
          ? {
              id: row.spk.bankRekeningPt.id,
              namaBank: row.spk.bankRekeningPt.namaBank,
              noRekening: row.spk.bankRekeningPt.noRekening,
              atasNama: row.spk.bankRekeningPt.atasNama,
            }
          : null,
        mandor: {
          id: row.spk.mandor.id,
          username: row.spk.mandor.username,
          namaBank: transferBank?.namaBank ?? "",
          noRekening: transferBank?.noRekening ?? "",
          atasNamaRekening: transferBank?.atasNamaRekening ?? "",
        },
      };
    }

    return entity;
  }
}
