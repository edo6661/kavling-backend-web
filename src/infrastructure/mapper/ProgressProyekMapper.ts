import type { Prisma } from "@prisma/client";
import type { ProgressProyekEntity } from "../../domain/entities/ProgressProyek.js";
import {
  getEffectiveTotalProgress,
  getEffectiveInfraTotalProgress,
} from "../../utils/progressProyekCalc.js";

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

export type ProgressProyekMapperOptions = {
  pekerjaanItemCount?: number;
  isInfra?: boolean;
};

export class ProgressProyekMapper {
  static readonly include = progressProyekInclude;

  static toDomain(
    prismaProgress: ProgressProyekWithRelations,
    options?: ProgressProyekMapperOptions,
  ): ProgressProyekEntity {
    const isInfra = options?.isInfra ?? prismaProgress.spkId != null;
    const tahapan = prismaProgress.tahapan.map((t) => ({
      id: t.id,
      progressProyekId: t.progressProyekId,
      namaTahapan: t.namaTahapan,
      persentase: Number(t.persentase),
      deskripsi: t.deskripsi,
      tanggal: t.tanggal,
      foto: t.foto ? (t.foto as string[]) : [],
      reportedBy: t.reportedBy,
    }));

    const baseInput = {
      persentase:
        prismaProgress.persentaseOverride != null
          ? Number(prismaProgress.persentaseOverride)
          : Number(prismaProgress.persentase),
      persentaseIsOverride: prismaProgress.persentaseOverride != null,
      tahapan,
    };

    const persentase = isInfra
      ? getEffectiveInfraTotalProgress({
          ...baseInput,
          pekerjaanItemCount: options?.pekerjaanItemCount ?? 0,
        })
      : getEffectiveTotalProgress(baseInput);

    return {
      id: prismaProgress.id,
      penjualanId: prismaProgress.penjualanId,
      kavlingId: prismaProgress.kavlingId,
      spkId: prismaProgress.spkId,
      mandorId: prismaProgress.mandorId,
      mandor: prismaProgress.mandor,
      persentaseOverride: prismaProgress.persentaseOverride
        ? Number(prismaProgress.persentaseOverride)
        : null,
      persentaseIsOverride: prismaProgress.persentaseOverride != null,
      persentase,
      createdAt: prismaProgress.createdAt,
      updatedAt: prismaProgress.updatedAt,
      tahapan,
    };
  }
}
