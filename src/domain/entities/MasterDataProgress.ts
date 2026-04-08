import type { Sp3r, StatusAkadPpjb } from "@prisma/client";

export interface KalkulasiProgress {
  totalHargaJual: number;
  totalNilaiRumah: number;
  totalSubsidiBonus: number;
  nilaiPenyerahan: number;
  ppnSubsidiBonus: number;
  bphtbSubsidiBonus: number;
  pphSubsidiBonus: number;
  totalBphtbPphSubsidi: number;
  njopTanahTotal: number;
  njopBangunanTotal: number;
  njopTotal: number;
  ppnNjop: number;
  bphtbNjop: number;
  pphNjop: number;
  totalBphtbPphNjop: number;
  selisihPajakPbb: number;
  upingKalkulasi: number;
}

export interface MasterDataProgressEntity {
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
