import type { BaseFilterDTO } from "./BaseFilterDTO.js";
import type { PaymentStatus } from "@prisma/client";

export interface CreateTagihanDTO {
  customerId: number;
  penjualanId: number;
  pembayaran: string;
  nominal: number;
  jatuhTempo: string | Date;
  reminderBerikutnya?: string | Date | null | undefined;
}

export interface UpdateTagihanDTO {
  pembayaran?: string | undefined;
  nominal?: number | undefined;
  jatuhTempo?: string | Date | undefined;
  status?: PaymentStatus | undefined;
  reminderBerikutnya?: string | Date | null | undefined;
  fileBukti?: string | null | undefined;
}

export interface TagihanResponseDTO {
  id: number;
  noTagihan: string;
  customerId: number;
  namaCustomer: string;
  penjualanId: number;
  perumahan: string;
  blok: string;
  nomorUnit: string;
  pembayaran: string;
  nominal: number;
  jatuhTempo: Date;
  status: PaymentStatus;
  fileBukti: string | null;
  reminderBerikutnya: Date | null;
  rekeningTujuan?: {
    namaBank: string;
    noRekening: string;
    atasNama: string;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TagihanFilterDTO extends BaseFilterDTO {
  customerId?: number;
  penjualanId?: number;
  status?: PaymentStatus;
}
