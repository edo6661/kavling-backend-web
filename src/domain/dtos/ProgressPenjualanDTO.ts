import type { ChecklistBastType } from "../entities/ProgressPenjualan.js";

export interface CreateProgressPenjualanDTO {
  penjualanId: number;
}

export interface UpdateProgressPenjualanDTO {
  berkasCustomerValid?: boolean | undefined;
  notarisId?: number | null | undefined;
  biayaNotaris?: number | null | undefined;
  fileSp3k?: string | null | undefined;
  fileSuratPernyataanAkadKredit?: string | null | undefined;
  fileSalinanAjb?: string | null | undefined;
  filePpjb?: string | null | undefined;
  nilaiAjb?: number | undefined;
  fileAjb?: string | null | undefined;
  nomorAjb?: string | undefined;
  tanggalAjb?: string | Date | undefined;
  fileBast?: string | null | undefined;
  checklistBast?: ChecklistBastType | null | undefined;
  sertifikatUrutan?: number | undefined;
}

export interface ProgressPenjualanSertifikatTambahanDTO {
  urutan: number;
  filePpjb: string | null;
  nilaiAjb: number | null;
  biayaBphtb: number | null;
  biayaPph: number | null;
  fileAjb: string | null;
  nomorAjb: string | null;
  tanggalAjb: Date | null;
}

export interface ProgressPenjualanTotalsDTO {
  nilaiAjb: number;
  biayaBphtb: number;
  biayaPph: number;
}

export interface ProgressPenjualanResponseDTO {
  id: number;
  penjualanId: number;
  notarisId?: number | null | undefined;
  biayaNotaris?: number | null | undefined;
  berkasCustomerValid: boolean;
  fileSp3k: string | null;
  fileSuratPernyataanAkadKredit: string | null;
  fileSalinanAjb: string | null;
  filePpjb: string | null;
  nilaiAjb: number | null;
  biayaBphtb: number | null;
  biayaPph: number | null;
  fileAjb: string | null;
  nomorAjb: string | null;
  tanggalAjb: Date | null;
  fileBast: string | null;
  checklistBast: ChecklistBastType | null;
  sertifikatTambahan: ProgressPenjualanSertifikatTambahanDTO[];
  totals: ProgressPenjualanTotalsDTO;
}

export interface UpdateProgressSertifikatTambahanDTO {
  filePpjb?: string | null | undefined;
  nilaiAjb?: number | undefined;
  fileAjb?: string | null | undefined;
  nomorAjb?: string | undefined;
  tanggalAjb?: string | Date | undefined;
}
