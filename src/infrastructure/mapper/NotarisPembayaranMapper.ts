import type { Prisma } from "@prisma/client";
import type { NotarisPembayaranEntity } from "../../domain/entities/NotarisPembayaran.js";

export const notarisPembayaranInclude = {
  dibayarOleh: { select: { id: true, username: true } },
  penjualan: {
    select: {
      id: true,
      noTransaksi: true,
      customer: { select: { id: true, nama: true } },
      kavling: {
        select: {
          blok: true,
          nomorUnit: true,
          perumahan: { select: { nama: true } },
        },
      },
      detailKavlingPajak: {
        select: {
          notaris: {
            select: {
              id: true,
              nama: true,
              namaBank: true,
              noRekening: true,
              atasNamaRekening: true,
            },
          },
        },
      },
    },
  },
} satisfies Prisma.NotarisPembayaranInclude;

export type NotarisPembayaranWithRelations = Prisma.NotarisPembayaranGetPayload<{
  include: typeof notarisPembayaranInclude;
}>;

export class NotarisPembayaranMapper {
  static readonly include = notarisPembayaranInclude;

  static toDomain(row: NotarisPembayaranWithRelations): NotarisPembayaranEntity {
    const entity: NotarisPembayaranEntity = {
      id: row.id,
      penjualanId: row.penjualanId,
      jenis: row.jenis,
      nominal: Number(row.nominal),
      status: row.status,
      buktiPembayaran: row.buktiPembayaran,
      tanggalPembayaran: row.tanggalPembayaran,
      bsiCmsDilaporkan: row.bsiCmsDilaporkan,
      bsiCmsDilaporkanAt: row.bsiCmsDilaporkanAt,
      dibayarOlehId: row.dibayarOlehId,
      dibayarOleh: row.dibayarOleh,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };

    if (row.penjualan) {
      entity.penjualan = {
        id: row.penjualan.id,
        noTransaksi: row.penjualan.noTransaksi,
        customer: row.penjualan.customer,
        kavling: row.penjualan.kavling,
        detailKavlingPajak: row.penjualan.detailKavlingPajak
          ? {
              notaris: row.penjualan.detailKavlingPajak.notaris
                ? {
                    id: row.penjualan.detailKavlingPajak.notaris.id,
                    nama: row.penjualan.detailKavlingPajak.notaris.nama,
                    namaBank: row.penjualan.detailKavlingPajak.notaris.namaBank,
                    noRekening:
                      row.penjualan.detailKavlingPajak.notaris.noRekening,
                    atasNamaRekening:
                      row.penjualan.detailKavlingPajak.notaris.atasNamaRekening,
                  }
                : null,
            }
          : null,
      };
    }

    return entity;
  }
}
