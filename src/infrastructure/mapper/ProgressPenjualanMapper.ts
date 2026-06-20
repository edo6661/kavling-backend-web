import type {
  DetailKavlingPajak,
  Penjualan,
  ProgressPenjualan as PrismaProgress,
  ProgressPenjualanSertifikatTambahan,
} from "@prisma/client";
import type {
  ProgressPenjualanResponseDTO,
  ProgressPenjualanSertifikatTambahanDTO,
} from "../../domain/dtos/ProgressPenjualanDTO.js";
import type { ChecklistBastType } from "../../domain/entities/ProgressPenjualan.js";
import {
  sumBiayaBphtb,
  sumBiayaPph,
  sumNilaiAjb,
} from "../../domain/progressPenjualan/progressPenjualanSertifikatUtils.js";

type ProgressWithRelations = PrismaProgress & {
  penjualan?:
    | (Penjualan & {
        detailKavlingPajak?: DetailKavlingPajak | null;
      })
    | null;
  sertifikatTambahan?: ProgressPenjualanSertifikatTambahan[];
};

export class ProgressPenjualanMapper {
  static mapSertifikatTambahan(
    row: ProgressPenjualanSertifikatTambahan,
  ): ProgressPenjualanSertifikatTambahanDTO {
    return {
      urutan: row.urutan,
      filePpjb: row.filePpjb,
      nilaiAjb: row.nilaiAjb ? Number(row.nilaiAjb) : null,
      biayaBphtb: row.biayaBphtb ? Number(row.biayaBphtb) : null,
      biayaPph: row.biayaPph ? Number(row.biayaPph) : null,
      fileAjb: row.fileAjb,
      nomorAjb: row.nomorAjb,
      tanggalAjb: row.tanggalAjb,
    };
  }

  static toDomain(
    prismaProgress: ProgressWithRelations,
  ): ProgressPenjualanResponseDTO {
    const sertifikatTambahan = (prismaProgress.sertifikatTambahan ?? [])
      .map((row) => ProgressPenjualanMapper.mapSertifikatTambahan(row))
      .sort((a, b) => a.urutan - b.urutan);

    const utamaSlot = {
      nilaiAjb: prismaProgress.nilaiAjb
        ? Number(prismaProgress.nilaiAjb)
        : null,
      biayaBphtb: prismaProgress.biayaBphtb
        ? Number(prismaProgress.biayaBphtb)
        : null,
      biayaPph: prismaProgress.biayaPph
        ? Number(prismaProgress.biayaPph)
        : null,
      filePpjb: prismaProgress.filePpjb,
      fileAjb: prismaProgress.fileAjb,
    };

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
      nilaiAjb: utamaSlot.nilaiAjb,
      biayaBphtb: utamaSlot.biayaBphtb,
      biayaPph: utamaSlot.biayaPph,
      fileAjb: prismaProgress.fileAjb,
      nomorAjb: prismaProgress.nomorAjb,
      tanggalAjb: prismaProgress.tanggalAjb,
      fileBast: prismaProgress.fileBast,
      checklistBast: prismaProgress.checklistBast
        ? (prismaProgress.checklistBast as ChecklistBastType)
        : null,
      sertifikatTambahan,
      totals: {
        nilaiAjb: sumNilaiAjb(utamaSlot, sertifikatTambahan),
        biayaBphtb: sumBiayaBphtb(utamaSlot, sertifikatTambahan),
        biayaPph: sumBiayaPph(utamaSlot, sertifikatTambahan),
      },
    };
  }
}
