export type StatusKodeBillingPph = "MENUNGGU_BAYAR" | "SUDAH_BAYAR";

export interface KodeBillingPphFilterDTO {
  search?: string;
  status?: StatusKodeBillingPph;
  customerId?: number;
  penjualanId?: number;
  orderBy?: { field: string; direction: "asc" | "desc" };
}

export interface KodeBillingPphResponseDTO {
  id: number;
  customerId: number;
  namaCustomer: string;
  penjualanId: number;
  perumahan: string | null;
  blok: string | null;
  nomorUnit: string | null;
  kodeBilling: string;
  fileBilling: string;
  fileBuktiBayar: string | null;
  status: StatusKodeBillingPph;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
}
