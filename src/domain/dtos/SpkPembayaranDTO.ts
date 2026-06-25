import type { SpkPembayaranStatus } from "@prisma/client";

export type SpkTerminPembayaranJenis =
  | "TERMIN_55"
  | "TERMIN_100"
  | "TERMIN_INFRA_20_1"
  | "TERMIN_INFRA_20_2"
  | "TERMIN_INFRA_20_3"
  | "TERMIN_INFRA_20_4"
  | "TERMIN_INFRA_15"
  | "RETENSI";

export interface SpkPembayaranUpahBarisInput {
  tukangId?: number | null | undefined;
  nik: string;
  nama: string;
  /** Opsional; jika total upah di level pembayaran, baris disimpan dengan nominal 0 */
  nominal?: number | undefined;
}

export interface SpkPembayaranKasbonBarisInput {
  namaSupplier: string;
  keterangan: string;
  tanggalPo: Date;
  nominal: number;
  fotoBon?: string | null;
}

export type CreateSpkPembayaranDTO =
  | {
      spkId: number;
      jenis: SpkTerminPembayaranJenis;
      diajukanOlehId: number;
      mandorRekeningId?: number;
    }
  | {
      spkId: number;
      jenis: "KASBON";
      diajukanOlehId: number;
      mandorRekeningId?: number;
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
      /** Total upah tukang (bukan per baris) */
      nominal: number;
      diajukanOlehId: number;
      mandorRekeningId?: number;
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
  nominal: number;
}
