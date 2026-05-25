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

export interface CreateProgressProyekByKavlingDTO {
  kavlingId: number;
  mandorId?: number | null;
}

export interface UpdateProgressProyekDTO {
  tahapan?: TahapanProyekDTO[] | undefined;
}

export interface ProgressProyekResponseDTO {
  id: number;
  penjualanId: number | null;
  kavlingId: number | null;
  mandorId: number | null;
  mandor: MandorSummaryDTO | null;
  persentase: number;
  tahapan: TahapanProyekDTO[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProgressProyekListFilterDTO {
  mandorUserId?: number;
}

export interface ProgressProyekListItemDTO {
  kavlingId: number;
  penjualanId: number | null;
  penjualanNoTransaksi: string | null;
  blok: string;
  nomorUnit: string;
  nama: string;
  status: string;
  progressProyek: {
    persentase: number;
    mandorId: number | null;
    mandor: MandorSummaryDTO | null;
  } | null;
}
