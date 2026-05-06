import type { ChecklistBastType } from "../entities/ProgressPenjualan.js";
export interface CreateProgressPenjualanDTO {
  penjualanId: number;
}
export interface UpdateProgressPenjualanDTO {
  berkasCustomerValid?: boolean | undefined;
  fileSp3k?: string | undefined;
  fileSalinanAjb?: string | undefined;
  filePpjb?: string | undefined;
  nilaiAjb?: number | undefined;
  fileAjb?: string | undefined;
  fileBast?: string | undefined;
  checklistBast?: ChecklistBastType | null | undefined;
}
export interface ProgressPenjualanResponseDTO {
  id: number;
  penjualanId: number;
  berkasCustomerValid: boolean;
  fileSp3k: string | null;
  fileSalinanAjb: string | null;
  filePpjb: string | null;
  nilaiAjb: number | null;
  biayaBphtb: number | null;
  biayaPph: number | null;
  fileAjb: string | null;
  fileBast: string | null;
  checklistBast: ChecklistBastType | null;
}
