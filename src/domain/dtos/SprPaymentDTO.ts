import type { BaseFilterDTO } from "./BaseFilterDTO.js";
import type { PaymentStatus } from "@prisma/client";

export interface CreateSprPaymentDTO {
  sprId: number;
  keterangan: string;
  jatuhTempo: Date;
  nilai: number;
}

export interface UpdateSprPaymentDTO {
  keterangan?: string | undefined;
  jatuhTempo?: Date | undefined;
  nilai?: number | undefined;
  statusPembayaran?: PaymentStatus | undefined;
  buktiTransfer?: string | undefined;
}

export interface SprPaymentResponseDTO {
  id: number;
  sprId: number;
  keterangan: string;
  jatuhTempo: Date;
  nilai: number;
  statusPembayaran: PaymentStatus;
  buktiTransfer: string | null;
  createdAt: Date;
}

export interface SprPaymentFilterDTO extends BaseFilterDTO {
  sprId?: number | undefined;
  statusPembayaran?: PaymentStatus | undefined;
}
export interface VerifySprPaymentDTO {
  isApproved: boolean;
}
