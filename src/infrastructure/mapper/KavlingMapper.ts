import type { Prisma } from "@prisma/client";
import type { KavlingEntity } from "../../domain/entities/Kavling.js";

type KavlingWithRelations = Prisma.KavlingGetPayload<{
  include: {
    perumahan: true;
    rekeningTujuan: true;
  };
}>;

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
      blok: prismaKavling.blok,
      nomorUnit: prismaKavling.nomorUnit,
      namaTipe: prismaKavling.namaTipe,
      luasBangunan: Number(prismaKavling.luasBangunan),
      luasTanah: Number(prismaKavling.luasTanah),
      hargaJual: Number(prismaKavling.hargaJual),
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
      createdAt: prismaKavling.createdAt,
      updatedAt: prismaKavling.updatedAt,
    };
  }
}
