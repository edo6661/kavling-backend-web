import type { Perumahan as PrismaPerumahan } from "@prisma/client";
import type { PerumahanEntity } from "../../domain/entities/Perumahan.js";

export class PerumahanMapper {
  static toDomain(prismaPerumahan: PrismaPerumahan): PerumahanEntity {
    return {
      id: prismaPerumahan.id,
      nama: prismaPerumahan.nama,
      logo: prismaPerumahan.logo,
      alamat: prismaPerumahan.alamat,
      createdAt: prismaPerumahan.createdAt,
      updatedAt: prismaPerumahan.updatedAt,
    };
  }
}
