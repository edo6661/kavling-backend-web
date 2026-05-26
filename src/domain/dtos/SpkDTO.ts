export interface CreateSpkDTO {
  noSpk: string;
  tanggalSpk: Date;
  judulPekerjaan: string;
  nilaiKontrak: number;
  bankRekeningPtId?: number | null;
  nilaiSudahDibayarkan?: number | null;
  sisaNilaiKontrak?: number | null;
  notesPekerjaan?: string | null;
  jatuhTempo?: Date | null;
  fileSpk?: string | null;
  mandorId: number;
  kavlingIds: number[];
}

export interface UpdateSpkDTO {
  noSpk?: string;
  tanggalSpk?: Date;
  judulPekerjaan?: string;
  nilaiKontrak?: number;
  bankRekeningPtId?: number | null;
  nilaiSudahDibayarkan?: number | null;
  sisaNilaiKontrak?: number | null;
  progressOverride?: number | null;
  notesPekerjaan?: string | null;
  jatuhTempo?: Date | null;
  fileSpk?: string | null;
  mandorId?: number;
  kavlingIds?: number[];
}

export interface SpkFilterDTO {
  search?: string;
  mandorId?: number;
}
