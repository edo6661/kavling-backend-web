import type { Prisma } from "@prisma/client";
import type { SpkPembayaranEntity } from "../../domain/entities/SpkPembayaran.js";

export const spkPembayaranInclude = {
  diajukanOleh: { select: { id: true, username: true } },
  dibayarOleh: { select: { id: true, username: true } },
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

  static toDomain(row: SpkPembayaranWithRelations): SpkPembayaranEntity {
    const entity: SpkPembayaranEntity = {
      id: row.id,
      spkId: row.spkId,
      jenis: row.jenis,
      nominal: Number(row.nominal),
      keterangan: row.keterangan,
      tanggalPo: row.tanggalPo,
      mengurangiTermin: row.mengurangiTermin,
      status: row.status,
      buktiPembayaran: row.buktiPembayaran,
      tanggalPembayaran: row.tanggalPembayaran,
      bsiCmsDilaporkan: row.bsiCmsDilaporkan,
      bsiCmsDilaporkanAt: row.bsiCmsDilaporkanAt,
      diajukanOlehId: row.diajukanOlehId,
      dibayarOlehId: row.dibayarOlehId,
      diajukanOleh: row.diajukanOleh,
      dibayarOleh: row.dibayarOleh,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };

    if (row.spk) {
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
          namaBank: row.spk.mandor.mandorProfile?.namaBank ?? "",
          noRekening: row.spk.mandor.mandorProfile?.noRekening ?? "",
          atasNamaRekening:
            row.spk.mandor.mandorProfile?.atasNamaRekening ?? "",
        },
      };
    }

    return entity;
  }
}
