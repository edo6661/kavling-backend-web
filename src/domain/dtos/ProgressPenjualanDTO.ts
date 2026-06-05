import type { ChecklistBastType } from "../entities/ProgressPenjualan.js";
export interface CreateProgressPenjualanDTO {
  penjualanId: number;
}
export interface UpdateProgressPenjualanDTO {
  berkasCustomerValid?: boolean | undefined;
  notarisId?: number | null | undefined;
  biayaNotaris?: number | null | undefined;
  fileSp3k?: string | undefined;
  fileSuratPernyataanAkadKredit?: string | undefined;
  fileSalinanAjb?: string | undefined;
  filePpjb?: string | undefined;
  nilaiAjb?: number | undefined;
  fileAjb?: string | undefined;
  nomorAjb?: string | undefined;
  tanggalAjb?: string | Date | undefined;
  fileBast?: string | undefined;
  checklistBast?: ChecklistBastType | null | undefined;
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
}
