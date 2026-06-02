export type StatusKodeBillingPph = "MENUNGGU_BAYAR" | "SUDAH_BAYAR";

export interface KodeBillingPphFilterDTO {
  search?: string | undefined;
  status?: StatusKodeBillingPph | undefined;
  customerId?: number | undefined;
  penjualanId?: number | undefined;
  orderBy?: { field: string; direction: "asc" | "desc" } | undefined;
}

export interface KodeBillingPphResponseDTO {
  id: number;
  customerId: number;
  namaCustomer: string;
  penjualanId: number;
  sertifikatUrutan: number;
  perumahan: string | null;
  blok: string | null;
  nomorUnit: string | null;
  kodeBilling: string;
  fileBilling: string;
  fileSuket: string | null;
  fileBuktiBayar: string | null;
  status: StatusKodeBillingPph;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
}
