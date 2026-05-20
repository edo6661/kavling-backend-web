export interface TahapanProyekEntity {
  id: number;
  progressProyekId: number;
  namaTahapan: string;
  persentase: number;
  deskripsi: string | null;
  tanggal: Date;
  foto: string[];
}

export interface ProgressProyekEntity {
  id: number;
  penjualanId: number;
  pelaksana: string | null;
  persentase: number;
  createdAt: Date;
  updatedAt: Date;
  tahapan: TahapanProyekEntity[];
}
