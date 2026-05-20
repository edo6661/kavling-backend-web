import type { Prisma } from "@prisma/client";
import type { ProgressProyekEntity } from "../../domain/entities/ProgressProyek.js";

type ProgressProyekWithRelations = Prisma.ProgressProyekGetPayload<{
  include: { tahapan: true };
}>;

export class ProgressProyekMapper {
  static toDomain(
    prismaProgress: ProgressProyekWithRelations,
  ): ProgressProyekEntity {
    return {
      id: prismaProgress.id,
      penjualanId: prismaProgress.penjualanId,
      pelaksana: prismaProgress.pelaksana,
      persentase: Number(prismaProgress.persentase),
      createdAt: prismaProgress.createdAt,
      updatedAt: prismaProgress.updatedAt,
      tahapan: prismaProgress.tahapan.map((t) => ({
        id: t.id,
        progressProyekId: t.progressProyekId,
        namaTahapan: t.namaTahapan,
        persentase: Number(t.persentase),
        deskripsi: t.deskripsi,
        tanggal: t.tanggal,
        foto: t.foto ? (t.foto as string[]) : [],
      })),
    };
  }
}
