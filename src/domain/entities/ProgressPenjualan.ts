export type ChecklistBastType = Record<
  string,
  string | boolean | number | null
>;

export interface ProgressPenjualanEntity {
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

  nomorAjb: string | null;
  tanggalAjb: Date | null;

  fileBast: string | null;
  checklistBast: ChecklistBastType | null;
  createdAt: Date;
  updatedAt: Date;
}
