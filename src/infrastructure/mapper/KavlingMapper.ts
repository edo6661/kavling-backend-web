import type { Prisma } from "@prisma/client";
import type { KavlingEntity } from "../../domain/entities/Kavling.js";

type KavlingWithRelations = Prisma.KavlingGetPayload<{
  include: {
    perumahan: true;
    rekeningTujuan: true;
  };
}> & {
  penjualan?: {
    customer: {
      nama: string;
      noHp: string;
    } | null;
  }[];
};

export class KavlingMapper {
  static toDomain(prismaKavling: KavlingWithRelations): KavlingEntity {
    return {
      id: prismaKavling.id,
      perumahanId: prismaKavling.perumahanId,
      perumahan: prismaKavling.perumahan
        ? {
            id: prismaKavling.perumahan.id,
            nama: prismaKavling.perumahan.nama,
          }
        : undefined,
      jenisKavling: prismaKavling.jenisKavling,
      blok: prismaKavling.blok,
      nomorUnit: prismaKavling.nomorUnit,
      namaTipe: prismaKavling.namaTipe,
      luasBangunan: Number(prismaKavling.luasBangunan),
      luasTanah: Number(prismaKavling.luasTanah),
      hargaDasar: Number(prismaKavling.hargaDasar),
      status: prismaKavling.status,
      rekeningTujuanId: prismaKavling.rekeningTujuanId,
      rekeningTujuan: prismaKavling.rekeningTujuan
        ? {
            namaBank: prismaKavling.rekeningTujuan.namaBank,
            noRekening: prismaKavling.rekeningTujuan.noRekening,
            atasNama: prismaKavling.rekeningTujuan.atasNama,
          }
        : null,
      filePbg: prismaKavling.filePbg,
      fileSertifikatTanah: prismaKavling.fileSertifikatTanah,
      fileNopPbb: prismaKavling.fileNopPbb,

      penjualan: prismaKavling.penjualan
        ? prismaKavling.penjualan.map((p) => ({
            customer: p.customer
              ? { nama: p.customer.nama, noHp: p.customer.noHp }
              : null,
          }))
        : undefined,

      createdAt: prismaKavling.createdAt,
      updatedAt: prismaKavling.updatedAt,
    };
  }
}
