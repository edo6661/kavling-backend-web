import type { ProgressPenjualan as PrismaProgress } from "@prisma/client";
import type { ProgressPenjualanResponseDTO } from "../../domain/dtos/ProgressPenjualanDTO.js";
import type { ChecklistBastType } from "../../domain/entities/ProgressPenjualan.js";

export class ProgressPenjualanMapper {
  static toDomain(
    prismaProgress: PrismaProgress,
  ): ProgressPenjualanResponseDTO {
    return {
      id: prismaProgress.id,
      penjualanId: prismaProgress.penjualanId,
      berkasCustomerValid: prismaProgress.berkasCustomerValid,
      fileSp3k: prismaProgress.fileSp3k,
      fileSalinanAjb: prismaProgress.fileSalinanAjb,
      filePpjb: prismaProgress.filePpjb,
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
