import type { ProgressProyekEntity } from "../entities/ProgressProyek.js";

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
  search?: string;
  orderBy?: {
    field: string;
    direction: "asc" | "desc";
  };
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
    persentaseIsOverride?: boolean;
    mandorId: number | null;
    mandor: MandorSummaryDTO | null;
    tahapanLatest?: Record<string, number>;
  } | null;
}

export interface ProgressInfraPekerjaanItemDTO {
  id: number;
  pekerjaanInfraId: number;
  nama: string;
  kategori: string;
  urutan: number;
  latestPersentase?: number | null;
}

export interface ProgressInfraListItemDTO {
  spkId: number;
  noSpk: string;
  judulPekerjaan: string;
  zonaNama: string | null;
  zonaHgb: string | null;
  mandor: MandorSummaryDTO;
  jatuhTempo: Date | null;
  progressProyek: {
    persentase: number;
    persentaseIsOverride?: boolean;
    mandorId: number | null;
    mandor: MandorSummaryDTO | null;
  } | null;
  pekerjaanItems: ProgressInfraPekerjaanItemDTO[];
}

export interface ProgressInfraListFilterDTO {
  mandorUserId?: number;
  search?: string;
}

export interface ProgressInfraDetailDTO {
  progress: ProgressProyekEntity;
  spk: {
    id: number;
    noSpk: string;
    judulPekerjaan: string;
    jatuhTempo: Date | null;
    zonaNama: string | null;
    zonaHgb: string | null;
    mandorId: number;
    mandor: MandorSummaryDTO;
  };
  pekerjaanItems: ProgressInfraPekerjaanItemDTO[];
}
