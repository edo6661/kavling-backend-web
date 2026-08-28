export interface MandorSummary {
  id: number;
  username: string;
}

import type { SpkPembayaranEntity } from "./SpkPembayaran.js";
import type {
  SpkCustomTerminStep,
  SpkTerminSchemeKey,
} from "../spk/spkTerminScheme.js";

export type { SpkCustomTerminStep, SpkTerminSchemeKey };

export type SpkJenis = "RUMAH" | "INFRASTRUKTUR";

export type SpkApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface SpkUserSummary {
  id: number;
  username: string;
}

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

export interface SpkBankRekeningPtSummary {
  id: number;
  namaBank: string;
  atasNama: string;
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
  terminScheme: SpkTerminSchemeKey;
  terminConfig?: SpkCustomTerminStep[] | null;
  tanggalSpk: Date;
  judulPekerjaan: string;
  nilaiKontrak: number;
  bankRekeningPtId: number | null;
  bankRekeningPt?: SpkBankRekeningPtSummary | null;
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
  fileRab: string | null;
  mandorId: number;
  mandor: MandorSummary;
  statusApproval: SpkApprovalStatus;
  diajukanOlehId: number | null;
  disetujuiOlehId: number | null;
  tanggalDisetujui: Date | null;
  catatanPenolakan: string | null;
  diajukanOleh: SpkUserSummary | null;
  disetujuiOleh: SpkUserSummary | null;
  kavlingItems: SpkKavlingItem[];
  pekerjaanInfraItems: SpkPekerjaanInfraItem[];
  pembayaranList?: SpkPembayaranEntity[];
  createdAt: Date;
  updatedAt: Date;
}
