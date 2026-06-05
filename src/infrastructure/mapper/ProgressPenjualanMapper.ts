import type {
  DetailKavlingPajak,
  Penjualan,
  ProgressPenjualan as PrismaProgress,
} from "@prisma/client";
import type { ProgressPenjualanResponseDTO } from "../../domain/dtos/ProgressPenjualanDTO.js";
import type { ChecklistBastType } from "../../domain/entities/ProgressPenjualan.js";

type ProgressWithRelations = PrismaProgress & {
  penjualan?:
    | (Penjualan & {
        detailKavlingPajak?: DetailKavlingPajak | null;
      })
    | null;
};

export class ProgressPenjualanMapper {
  static toDomain(
    prismaProgress: ProgressWithRelations,
  ): ProgressPenjualanResponseDTO {
    return {
      id: prismaProgress.id,
      penjualanId: prismaProgress.penjualanId,
      berkasCustomerValid: prismaProgress.berkasCustomerValid,
      fileSp3k: prismaProgress.fileSp3k,
      fileSuratPernyataanAkadKredit:
        prismaProgress.fileSuratPernyataanAkadKredit,
      fileSalinanAjb: prismaProgress.fileSalinanAjb,
      filePpjb: prismaProgress.filePpjb,
      notarisId:
        prismaProgress.penjualan?.detailKavlingPajak?.notarisId ?? null,
      biayaNotaris: prismaProgress.penjualan?.detailKavlingPajak?.biayaNotaris
        ? Number(prismaProgress.penjualan.detailKavlingPajak.biayaNotaris)
        : null,
      nilaiAjb: prismaProgress.nilaiAjb
        ? Number(prismaProgress.nilaiAjb)
        : null,
      biayaBphtb: prismaProgress.biayaBphtb
        ? Number(prismaProgress.biayaBphtb)
        : null,
      biayaPph: prismaProgress.biayaPph
        ? Number(prismaProgress.biayaPph)
        : null,
      fileAjb: prismaProgress.fileAjb,
      nomorAjb: prismaProgress.nomorAjb,
      tanggalAjb: prismaProgress.tanggalAjb,
      fileBast: prismaProgress.fileBast,
      checklistBast: prismaProgress.checklistBast
        ? (prismaProgress.checklistBast as ChecklistBastType)
        : null,
    };
  }
}
