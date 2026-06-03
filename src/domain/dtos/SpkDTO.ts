export interface CreateSpkDTO {
  noSpk: string;
  tanggalSpk: Date;
  judulPekerjaan: string;
  nilaiKontrak: number;
  bankRekeningPtId?: number | null | undefined;
  nilaiSudahDibayarkan?: number | null | undefined;
  sisaNilaiKontrak?: number | null | undefined;
  notesPekerjaan?: string | null | undefined;
  jatuhTempo?: Date | null | undefined;
  fileSpk?: string | null | undefined;
  mandorId: number;
  kavlingIds: number[];
}

export interface UpdateSpkDTO {
  noSpk?: string | undefined;
  tanggalSpk?: Date | undefined;
  judulPekerjaan?: string | undefined;
  nilaiKontrak?: number | undefined;
  bankRekeningPtId?: number | null | undefined;
  nilaiSudahDibayarkan?: number | null | undefined;
  sisaNilaiKontrak?: number | null | undefined;
  progressOverride?: number | null | undefined;
  notesPekerjaan?: string | null | undefined;
  jatuhTempo?: Date | null | undefined;
  fileSpk?: string | null | undefined;
  mandorId?: number | undefined;
  kavlingIds?: number[] | undefined;
}

export interface SpkFilterDTO {
  search?: string;
  mandorId?: number;
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
