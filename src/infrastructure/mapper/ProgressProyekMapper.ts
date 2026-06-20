import type { Prisma } from "@prisma/client";
import type { ProgressProyekEntity } from "../../domain/entities/ProgressProyek.js";
import { getEffectiveTotalProgress } from "../../utils/progressProyekCalc.js";

export const progressProyekInclude = {
  mandor: { select: { id: true, username: true } },
  tahapan: {
    include: {
      reportedBy: { select: { id: true, username: true } },
    },
    orderBy: [{ tanggal: "desc" as const }, { id: "desc" as const }],
  },
} satisfies Prisma.ProgressProyekInclude;

export type ProgressProyekWithRelations = Prisma.ProgressProyekGetPayload<{
  include: typeof progressProyekInclude;
}>;

export class ProgressProyekMapper {
  static readonly include = progressProyekInclude;

  static toDomain(
    prismaProgress: ProgressProyekWithRelations,
  ): ProgressProyekEntity {
    return {
      id: prismaProgress.id,
      penjualanId: prismaProgress.penjualanId,
      kavlingId: prismaProgress.kavlingId,
      mandorId: prismaProgress.mandorId,
      mandor: prismaProgress.mandor,
      persentaseOverride: prismaProgress.persentaseOverride
        ? Number(prismaProgress.persentaseOverride)
        : null,
      persentaseIsOverride: prismaProgress.persentaseOverride != null,
      persentase: getEffectiveTotalProgress({
        persentase:
          prismaProgress.persentaseOverride != null
            ? Number(prismaProgress.persentaseOverride)
            : Number(prismaProgress.persentase),
        persentaseIsOverride: prismaProgress.persentaseOverride != null,
        tahapan: prismaProgress.tahapan,
      }),
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
        reportedBy: t.reportedBy,
      })),
    };
  }
}
