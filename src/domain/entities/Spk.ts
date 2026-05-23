export interface MandorSummary {
  id: number;
  username: string;
}

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
  notesPekerjaan: string | null;
  jatuhTempo: Date | null;
  fileSpk: string | null;
  mandorId: number;
  mandor: MandorSummary;
  kavlingItems: SpkKavlingItem[];
  createdAt: Date;
  updatedAt: Date;
}
