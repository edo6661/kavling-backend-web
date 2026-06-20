export interface MandorSummary {
  id: number;
  username: string;
}

import type { SpkPembayaranEntity } from "./SpkPembayaran.js";

export type SpkJenis = "RUMAH" | "INFRASTRUKTUR";

export interface SpkKavlingItem {
  id: number;
  kavlingId: number;
  blok: string;
  nomorUnit: string;
  luasTanah: number;
  luasBangunan: number;
  customerNama: string;
}

export interface SpkZonaSummary {
  id: number;
  nama: string;
  hgb: string;
  luas: string;
  deskripsi: string;
}

export interface SpkPekerjaanInfraItem {
  id: number;
  pekerjaanInfraId: number;
  nama: string;
  kategori: string;
  urutan: number;
}

export interface SpkEntity {
  id: number;
  noSpk: string;
  jenis: SpkJenis;
  tanggalSpk: Date;
  judulPekerjaan: string;
  nilaiKontrak: number;
  bankRekeningPtId: number | null;
  zonaId: number | null;
  zona: SpkZonaSummary | null;
  nilaiSudahDibayarkan: number | null;
  sisaNilaiKontrak: number | null;
  progressOverride: number | null;
  progress: number;
  progressIsOverride: boolean;
  notesPekerjaan: string | null;
  jatuhTempo: Date | null;
  fileSpk: string | null;
  mandorId: number;
  mandor: MandorSummary;
  kavlingItems: SpkKavlingItem[];
  pekerjaanInfraItems: SpkPekerjaanInfraItem[];
  pembayaranList?: SpkPembayaranEntity[];
  createdAt: Date;
  updatedAt: Date;
}
