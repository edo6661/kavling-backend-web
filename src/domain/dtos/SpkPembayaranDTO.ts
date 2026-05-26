import type { SpkPembayaranJenis, SpkPembayaranStatus } from "@prisma/client";

export interface CreateSpkPembayaranDTO {
  spkId: number;
  jenis: SpkPembayaranJenis;
  diajukanOlehId: number;
}

export interface BayarSpkPembayaranDTO {
  id: number;
  dibayarOlehId: number;
  tanggalPembayaran?: Date;
  buktiPembayaran: string;
}

export interface SpkPembayaranFilterDTO {
  status?: SpkPembayaranStatus;
  spkId?: number;
  search?: string;
}
