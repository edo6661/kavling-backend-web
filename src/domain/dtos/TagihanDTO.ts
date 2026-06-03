import type { BaseFilterDTO } from "./BaseFilterDTO.js";
import type { PaymentStatus, TagihanTujuan } from "@prisma/client";

export interface CreateTagihanDTO {
  customerId: number;
  penjualanId: number;
  pembayaran: string;
  /** Jika tidak diisi, server menginfer dari teks `pembayaran` (kompatibel API lama). */
  tujuan?: TagihanTujuan | undefined;
  nominal: number;
  jatuhTempo: string | Date;
  reminderBerikutnya?: string | Date | null | undefined;
}

export interface UpdateTagihanDTO {
  pembayaran?: string | undefined;
  tujuan?: TagihanTujuan | undefined;
  nominal?: number | undefined;
  jatuhTempo?: string | Date | undefined;
  status?: PaymentStatus | undefined;
  reminderBerikutnya?: string | Date | null | undefined;
  fileBukti?: string | null | undefined;
  fileBuktiList?: string[] | null | undefined;
}

export interface TagihanResponseDTO {
  id: number;
  noTagihan: string;
  customerId: number;
  namaCustomer: string;
  namaAgent: string;
  penjualanId: number;
  perumahan: string;
  blok: string;
  nomorUnit: string;
  tujuan: TagihanTujuan;
  pembayaran: string;
  nominal: number;
  jatuhTempo: Date;
  status: PaymentStatus;
  fileBukti: string | null;
  fileBuktiList: string[];
  reminderBerikutnya: Date | null;
  isRefunded?: boolean;
  fileBuktiRefund?: string | null;
  ttdData?: any;
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
