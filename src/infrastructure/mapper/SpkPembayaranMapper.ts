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
      mandor: { select: { id: true, username: true } },
    },
  },
} satisfies Prisma.SpkPembayaranInclude;

export type SpkPembayaranWithRelations = Prisma.SpkPembayaranGetPayload<{
  include: typeof spkPembayaranInclude;
}>;

export class SpkPembayaranMapper {
  static readonly include = spkPembayaranInclude;

  static toDomain(row: SpkPembayaranWithRelations): SpkPembayaranEntity {
    return {
      id: row.id,
      spkId: row.spkId,
      jenis: row.jenis,
      nominal: Number(row.nominal),
      status: row.status,
      buktiPembayaran: row.buktiPembayaran,
      tanggalPembayaran: row.tanggalPembayaran,
      diajukanOlehId: row.diajukanOlehId,
      dibayarOlehId: row.dibayarOlehId,
      diajukanOleh: row.diajukanOleh,
      dibayarOleh: row.dibayarOleh,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      spk: row.spk
        ? {
            id: row.spk.id,
            noSpk: row.spk.noSpk,
            judulPekerjaan: row.spk.judulPekerjaan,
            nilaiKontrak: Number(row.spk.nilaiKontrak),
            mandor: row.spk.mandor,
          }
        : undefined,
    };
  }
}
