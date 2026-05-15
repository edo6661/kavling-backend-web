import type { Prisma } from "@prisma/client";
import type { NotarisEntity } from "../../domain/entities/Notaris.js";

export type NotarisWithRelations = Prisma.NotarisGetPayload<{
  include: {
    pics: true;
    detailKavlingPajak: {
      include: {
        penjualan: {
          include: {
            customer: { select: { nama: true } };
            kavling: {
              include: { perumahan: { select: { nama: true } } };
            };
          };
        };
      };
    };
  };
}>;

export class NotarisMapper {
  static toDomain(prismaNotaris: NotarisWithRelations): NotarisEntity {
    return {
      id: prismaNotaris.id,
      nama: prismaNotaris.nama,
      nomorKtp: prismaNotaris.nomorKtp ?? null,
      nomorIjin: prismaNotaris.nomorIjin ?? null,
      noHp: prismaNotaris.noHp ?? null,
      alamat: prismaNotaris.alamat ?? null,
      biayaAjb: Number(prismaNotaris.biayaAjb),
      createdAt: prismaNotaris.createdAt,
      updatedAt: prismaNotaris.updatedAt,
      pics: prismaNotaris.pics.map((pic) => ({
        id: pic.id,
        notarisId: pic.notarisId,
        nama: pic.nama,
        noHp: pic.noHp,
        alamat: pic.alamat,
        createdAt: pic.createdAt,
        updatedAt: pic.updatedAt,
      })),
      ajbDitangani: prismaNotaris.detailKavlingPajak
        ? prismaNotaris.detailKavlingPajak
            .filter((detail) => detail.penjualan.status !== "BATAL")
            .map((detail) => ({
              id: detail.penjualan.noTransaksi,
              customer: detail.penjualan.customer.nama,
              kavling: `${detail.penjualan.kavling.perumahan.nama} (${detail.penjualan.kavling.blok}-${detail.penjualan.kavling.nomorUnit})`,
              biayaAjbTransaksi: Number(detail.pjBiayaAjb),
            }))
        : [],
    };
  }
}
