export interface MandorSummary {
  id: number;
  username: string;
}

import type { SpkPembayaranEntity } from "./SpkPembayaran.js";

export interface SpkKavlingItem {
  id: number;
  kavlingId: number;
  blok: string;
  nomorUnit: string;
  customerNama: string;
}

export interface SpkEntity {
  id: number;
  noSpk: string;
  tanggalSpk: Date;
  judulPekerjaan: string;
  nilaiKontrak: number;
  kasbonSebelumTermin2: number | null;
  kasbonSebelumTermin3: number | null;
  kasbonSebelumTermin4: number | null;
  bankRekeningPtId: number | null;
  nilaiBisaDitagihkan: number | null;
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
  pembayaranList?: SpkPembayaranEntity[];
  createdAt: Date;
  updatedAt: Date;
}
