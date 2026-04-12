import type { BaseFilterDTO } from "./BaseFilterDTO.js";

export interface CreateFeeAgentDTO {
  agentId: number;
  penjualanId: number;
}

export interface UpdateFeeAgentDTO {
  bookingNominal?: number | undefined;
  bookingTanggal?: string | Date | undefined;
  closingNominal?: number | undefined;
  closingTanggal?: string | Date | undefined;
  marketingNominal?: number | undefined;
  marketingTanggal?: string | Date | undefined;
  bookingBukti?: string | null | undefined;
  closingBukti?: string | null | undefined;
  marketingBukti?: string | null | undefined;
}

export interface FeeAgentResponseDTO {
  id: number;
  agentId: number;
  namaAgent: string;
  penjualanId: number;
  noTransaksi: string;
  namaCustomer: string;
  kavling: string;
  bookingNominal: number | null;
  bookingTanggal: Date | null;
  bookingBukti: string | null;
  closingNominal: number | null;
  closingTanggal: Date | null;
  closingBukti: string | null;
  marketingNominal: number | null;
  marketingTanggal: Date | null;
  marketingBukti: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface FeeAgentFilterDTO extends BaseFilterDTO {
  agentId?: number;
  penjualanId?: number;
}
