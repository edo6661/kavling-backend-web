import type { SpkPembayaranStatus } from "@prisma/client";

export type SpkTerminPembayaranJenis = "TERMIN_55" | "TERMIN_100" | "RETENSI";

export interface SpkPembayaranUpahBarisInput {
  tukangId?: number | null;
  nik: string;
  nama: string;
  nominal: number;
}

export interface SpkPembayaranKasbonBarisInput {
  keterangan: string;
  tanggalPo: Date;
  nominal: number;
}

export type CreateSpkPembayaranDTO =
  | {
      spkId: number;
      jenis: SpkTerminPembayaranJenis;
      diajukanOlehId: number;
    }
  | {
      spkId: number;
      jenis: "KASBON";
      diajukanOlehId: number;
      /** Pengajuan multi-kasbon (satu pembayaran, beberapa bukti) */
      kasbonBaris?: SpkPembayaranKasbonBarisInput[];
      /** Kasbon tunggal — data production lama */
      keterangan?: string;
      nominal?: number;
      tanggalPo?: Date;
    }
  | {
      spkId: number;
      jenis: "UPAH";
      tanggalDari: Date;
      tanggalSampai: Date;
      baris: SpkPembayaranUpahBarisInput[];
      diajukanOlehId: number;
    };

export interface BayarSpkPembayaranDTO {
  id: number;
  dibayarOlehId: number;
  tanggalPembayaran?: Date;
  buktiPembayaran: string;
  buktiPembayaranList: string[];
}

export interface AddBuktiSpkPembayaranDTO {
  id: number;
  buktiPembayaranList: string[];
}

export interface RemoveBuktiSpkPembayaranDTO {
  id: number;
  buktiUrl: string;
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

export type UpdateSpkKasbonDTO =
  | {
      id: number;
      kasbonBaris: SpkPembayaranKasbonBarisInput[];
    }
  | {
      id: number;
      keterangan: string;
      nominal: number;
      tanggalPo: Date;
    };

export interface UpdateSpkUpahDTO {
  id: number;
  tanggalDari: Date;
  tanggalSampai: Date;
  baris: SpkPembayaranUpahBarisInput[];
}
