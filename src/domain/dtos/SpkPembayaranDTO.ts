import type { SpkPembayaranStatus } from "@prisma/client";

export type SpkTerminPembayaranJenis = "TERMIN_55" | "TERMIN_100" | "RETENSI";

export type CreateSpkPembayaranDTO =
  | {
      spkId: number;
      jenis: SpkTerminPembayaranJenis;
      diajukanOlehId: number;
    }
  | {
      spkId: number;
      jenis: "KASBON";
      keterangan: string;
      nominal: number;
      diajukanOlehId: number;
    };

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

export interface SetBsiCmsDilaporkanDTO {
  ids: number[];
  dilaporkan: boolean;
}
