import type { Prisma } from "@prisma/client";
import type { SpkEntity } from "../../domain/entities/Spk.js";

export const spkInclude = {
  mandor: { select: { id: true, username: true } },
  penjualanItems: {
    include: {
      kavling: {
        include: {
          penjualan: {
            where: { status: { not: "BATAL" } },
            orderBy: { id: "desc" as const },
            take: 1,
            include: { customer: { select: { nama: true } } },
          },
        },
      },
    },
  },
} satisfies Prisma.SpkInclude;

export type SpkWithRelations = Prisma.SpkGetPayload<{
  include: typeof spkInclude;
}>;

export class SpkMapper {
  static readonly include = spkInclude;

  static toDomain(row: SpkWithRelations): SpkEntity {
    return {
      id: row.id,
      noSpk: row.noSpk,
      tanggalSpk: row.tanggalSpk,
      judulPekerjaan: row.judulPekerjaan,
      nilaiKontrak: Number(row.nilaiKontrak),
      notesPekerjaan: row.notesPekerjaan,
      jatuhTempo: row.jatuhTempo,
      fileSpk: row.fileSpk,
      mandorId: row.mandorId,
      mandor: row.mandor,
      kavlingItems: row.penjualanItems.map((item) => {
        const activePenjualan = item.kavling.penjualan[0];
        return {
          id: item.id,
          kavlingId: item.kavlingId,
          blok: item.kavling.blok,
          nomorUnit: item.kavling.nomorUnit,
          customerNama: activePenjualan?.customer?.nama ?? "-",
        };
      }),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
