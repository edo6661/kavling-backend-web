import type { BaseFilterDTO } from "./BaseFilterDTO.js";
import type { Sp3r, StatusAkadPpjb } from "@prisma/client";
import type { KalkulasiProgress } from "../entities/MasterDataProgress.js";

export interface CreateMasterDataProgressDTO {
  sprId: number;
}

export interface UpdateMasterDataProgressDTO {
  tanggalAkadPpjb?: Date | undefined;
  statusAkadPpjb?: StatusAkadPpjb | undefined;
  tanggalAkadAjbPpat?: Date | undefined;
  tanggalPembayaranPph?: Date | undefined;
  tanggalPembayaranBphtb?: Date | undefined;
  pembiayaan?: string | undefined;
  sp3r?: Sp3r | undefined;
  hargaLebihTanah?: number | undefined;
  biayaStrategis?: number | undefined;
  biayaKpr?: number | undefined;
  biayaAsuransi?: number | undefined;
  diskonAngsuran?: number | undefined;
  diskonCashKeras?: number | undefined;
  diskonLainnya?: number | undefined;
  biayaBalikNama?: number | undefined;
  biayaNotarisAjb?: number | undefined;
  biayaAppraisal?: number | undefined;
  biayaBphtb?: number | undefined;
  biayaLainLain?: number | undefined;
  ppn?: number | undefined;
  pph?: number | undefined;
  njopTanahPerMeter?: number | undefined;
  njopBangunanPerMeter?: number | undefined;
  uping?: number | undefined;
}

export interface MasterDataProgressResponseDTO {
  id: number;
  sprId: number;
  tanggalAkadPpjb: Date | null;
  statusAkadPpjb: StatusAkadPpjb | null;
  tanggalAkadAjbPpat: Date | null;
  tanggalPembayaranPph: Date | null;
  tanggalPembayaranBphtb: Date | null;
  pembiayaan: string | null;
  sp3r: Sp3r | null;
  hargaLebihTanah: number | null;
  biayaStrategis: number | null;
  biayaKpr: number | null;
  biayaAsuransi: number | null;
  diskonAngsuran: number | null;
  diskonCashKeras: number | null;
  diskonLainnya: number | null;
  biayaBalikNama: number | null;
  biayaNotarisAjb: number | null;
  biayaAppraisal: number | null;
  biayaBphtb: number | null;
  biayaLainLain: number | null;
  ppn: number | null;
  pph: number | null;
  njopTanahPerMeter: number | null;
  njopBangunanPerMeter: number | null;
  uping: number | null;

  kalkulasi?: KalkulasiProgress;

  createdAt: Date;
  updatedAt: Date;
}

export interface MasterDataProgressFilterDTO extends BaseFilterDTO {
  sprId?: number | undefined;
  statusAkadPpjb?: StatusAkadPpjb | undefined;
}
