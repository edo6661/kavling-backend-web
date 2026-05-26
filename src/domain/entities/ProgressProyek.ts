export interface MandorSummary {
  id: number;
  username: string;
}

export interface TahapanProyekEntity {
  id: number;
  progressProyekId: number;
  namaTahapan: string;
  persentase: number;
  deskripsi: string | null;
  tanggal: Date;
  foto: string[];
  reportedBy: MandorSummary | null;
}

export interface ProgressProyekEntity {
  id: number;
  penjualanId: number | null;
  kavlingId: number | null;
  mandorId: number | null;
  mandor: MandorSummary | null;
  persentase: number;
  persentaseOverride: number | null;
  persentaseIsOverride: boolean;
  createdAt: Date;
  updatedAt: Date;
  tahapan: TahapanProyekEntity[];
}
