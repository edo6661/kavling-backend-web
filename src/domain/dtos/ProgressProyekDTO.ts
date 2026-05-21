export interface MandorSummaryDTO {
  id: number;
  username: string;
}

export interface TahapanProyekDTO {
  id?: number;
  namaTahapan: string;
  persentase: number;
  deskripsi: string | null;
  tanggal: Date;
  foto: string[];
  reportedBy?: MandorSummaryDTO | null;
}

export interface CreateProgressProyekDTO {
  penjualanId: number;
  mandorId?: number | null;
}

export interface UpdateProgressProyekDTO {
  mandorId?: number | null | undefined;
  tahapan?: TahapanProyekDTO[] | undefined;
}

export interface ProgressProyekResponseDTO {
  id: number;
  penjualanId: number;
  mandorId: number | null;
  mandor: MandorSummaryDTO | null;
  persentase: number;
  tahapan: TahapanProyekDTO[];
  createdAt: Date;
  updatedAt: Date;
}
