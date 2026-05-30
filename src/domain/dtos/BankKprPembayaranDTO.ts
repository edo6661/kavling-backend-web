import type { BankKprPembayaranStatus } from "@prisma/client";

export interface BayarBankKprPembayaranDTO {
  id: number;
  dibayarOlehId: number;
  tanggalPembayaran?: Date;
  buktiPembayaran: string;
}

export interface BankKprPembayaranFilterDTO {
  status?: BankKprPembayaranStatus;
  penjualanId?: number;
  search?: string;
}

export interface SetBankKprBsiCmsDilaporkanDTO {
  ids: number[];
  dilaporkan: boolean;
}
