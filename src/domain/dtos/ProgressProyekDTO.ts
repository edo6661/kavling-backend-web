export interface TahapanProyekDTO {
  id?: number;
  namaTahapan: string;
  persentase: number;
  deskripsi: string | null;
  tanggal: Date;
  foto: string[]; // Array of URL strings
}

export interface CreateProgressProyekDTO {
  penjualanId: number;
  pelaksana: string;
}

export interface UpdateProgressProyekDTO {
  pelaksana?: string | undefined;
  tahapan?: TahapanProyekDTO[] | undefined;
}

export interface ProgressProyekResponseDTO {
  id: number;
  penjualanId: number;
  pelaksana: string | null;
  persentase: number;
  tahapan: TahapanProyekDTO[];
  createdAt: Date;
  updatedAt: Date;
}
