export interface CreateSpkDTO {
  noSpk: string;
  tanggalSpk: Date;
  judulPekerjaan: string;
  nilaiKontrak: number;
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
  notesPekerjaan?: string | null;
  jatuhTempo?: Date | null;
  fileSpk?: string | null;
  mandorId?: number;
  kavlingIds?: number[];
}

export interface SpkFilterDTO {
  search?: string;
}
