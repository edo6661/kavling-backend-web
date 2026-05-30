import type { NotarisPembayaranStatus } from "@prisma/client";

export interface BayarNotarisPembayaranDTO {
  id: number;
  dibayarOlehId: number;
  tanggalPembayaran?: Date;
  buktiPembayaran: string;
}

export interface NotarisPembayaranFilterDTO {
  status?: NotarisPembayaranStatus;
  penjualanId?: number;
  search?: string;
}

export interface SetNotarisBsiCmsDilaporkanDTO {
  ids: number[];
  dilaporkan: boolean;
}
