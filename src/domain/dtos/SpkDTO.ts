import type {
  SpkJenis,
  SpkTerminSchemeKey,
  SpkApprovalStatus,
  SpkCustomTerminStep,
} from "../entities/Spk.js";

export interface CreateSpkDTO {
  noSpk: string;
  jenis?: SpkJenis | undefined;
  terminScheme?: SpkTerminSchemeKey | undefined;
  terminConfig?: SpkCustomTerminStep[] | null | undefined;
  tanggalSpk: Date;
  judulPekerjaan: string;
  nilaiKontrak: number;
  bankRekeningPtId?: number | null | undefined;
  zonaId?: number | null | undefined;
  nilaiSudahDibayarkan?: number | null | undefined;
  sisaNilaiKontrak?: number | null | undefined;
  notesPekerjaan?: string | null | undefined;
  jatuhTempo?: Date | null | undefined;
  fileSpk?: string | null | undefined;
  fileRab?: string | null | undefined;
  mandorId: number;
  kavlingIds?: number[] | undefined;
  pekerjaanInfraIds?: number[] | undefined;
  diajukanOlehId?: number | undefined;
}

export interface UpdateSpkDTO {
  noSpk?: string | undefined;
  terminScheme?: SpkTerminSchemeKey | undefined;
  terminConfig?: SpkCustomTerminStep[] | null | undefined;
  tanggalSpk?: Date | undefined;
  judulPekerjaan?: string | undefined;
  nilaiKontrak?: number | undefined;
  bankRekeningPtId?: number | null | undefined;
  zonaId?: number | null | undefined;
  nilaiSudahDibayarkan?: number | null | undefined;
  sisaNilaiKontrak?: number | null | undefined;
  progressOverride?: number | null | undefined;
  notesPekerjaan?: string | null | undefined;
  jatuhTempo?: Date | null | undefined;
  fileSpk?: string | null | undefined;
  fileRab?: string | null | undefined;
  mandorId?: number | undefined;
  kavlingIds?: number[] | undefined;
  pekerjaanInfraIds?: number[] | undefined;
}

export interface SpkFilterDTO {
  search?: string;
  mandorId?: number;
  jenis?: SpkJenis;
  statusApproval?: SpkApprovalStatus;
  orderBy?: "mandor:asc" | "mandor:desc" | "id:desc";
}

export interface SpkListSummary {
  totalSpk: number;
  totalKavling: number;
  totalNilaiKontrak: number;
  totalSudahDibayar: number;
  totalSisaNilai: number;
  progressSelesai: number;
}
