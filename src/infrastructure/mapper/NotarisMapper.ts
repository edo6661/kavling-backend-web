import type { Prisma } from "@prisma/client";
import type { NotarisEntity } from "../../domain/entities/Notaris.js";

export type NotarisWithRelations = Prisma.NotarisGetPayload<{
  include: { pics: true };
}>;

export class NotarisMapper {
  static toDomain(prismaNotaris: NotarisWithRelations): NotarisEntity {
    return {
      id: prismaNotaris.id,
      nama: prismaNotaris.nama,
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
    };
  }
}
