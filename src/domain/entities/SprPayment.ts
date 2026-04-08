import type { PaymentStatus } from "@prisma/client";

export interface SprPaymentEntity {
  id: number;
  sprId: number;
  keterangan: string;
  jatuhTempo: Date;
  nilai: number;
  statusPembayaran: PaymentStatus;
  buktiTransfer: string | null;
  createdAt: Date;
  updatedAt: Date;
}
