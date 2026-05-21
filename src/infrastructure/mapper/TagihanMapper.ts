import type { Prisma } from "@prisma/client";
import type { TagihanResponseDTO } from "../../domain/dtos/TagihanDTO.js";

type TagihanWithRelations = Prisma.TagihanGetPayload<{
  include: {
    customer: { select: { nama: true } };
    penjualan: {
      include: {
        kavling: {
          include: {
            perumahan: { select: { nama: true } };
            rekeningTujuan: true;
          };
        };
        rekeningTujuan: true;
      };
    };
  };
}>;

export class TagihanMapper {
  static toDomain(prismaTagihan: TagihanWithRelations): TagihanResponseDTO {
    return {
      id: prismaTagihan.id,
      noTagihan: prismaTagihan.noTagihan,
      customerId: prismaTagihan.customerId,
      namaCustomer: prismaTagihan.customer.nama,
      penjualanId: prismaTagihan.penjualanId,
      perumahan: prismaTagihan.penjualan.kavling.perumahan.nama,
      blok: prismaTagihan.penjualan.kavling.blok,
      nomorUnit: prismaTagihan.penjualan.kavling.nomorUnit,
      tujuan: prismaTagihan.tujuan,
      pembayaran: prismaTagihan.pembayaran,
      nominal: Number(prismaTagihan.nominal),
      jatuhTempo: prismaTagihan.jatuhTempo,
      status: prismaTagihan.status,
      fileBukti: prismaTagihan.fileBukti,
      reminderBerikutnya: prismaTagihan.reminderBerikutnya,
      isRefunded: prismaTagihan.isRefunded ?? false,
      fileBuktiRefund: prismaTagihan.fileBuktiRefund ?? null,
      ttdData: prismaTagihan.ttdData ?? null,
      rekeningTujuan: prismaTagihan.penjualan.kavling.rekeningTujuan
        ? {
            namaBank: prismaTagihan.penjualan.kavling.rekeningTujuan.namaBank,
            noRekening:
              prismaTagihan.penjualan.kavling.rekeningTujuan.noRekening,
            atasNama: prismaTagihan.penjualan.kavling.rekeningTujuan.atasNama,
          }
        : null,
      createdAt: prismaTagihan.createdAt,
      updatedAt: prismaTagihan.updatedAt,
    };
  }
}
