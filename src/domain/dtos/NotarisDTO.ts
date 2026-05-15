import type { BaseFilterDTO } from "./BaseFilterDTO.js";

export interface PicNotarisDTO {
  id?: number | undefined;
  nama: string;
  noHp: string;
  alamat?: string | undefined;
}

export interface AjbDitanganiDTO {
  id: string;
  customer: string;
  kavling: string;
}

export interface CreateNotarisDTO {
  nama: string;
  biayaAjb: number;
  nomorKtp?: string;
  nomorIjin?: string;
  pics?: PicNotarisDTO[] | undefined;
}

export interface UpdateNotarisDTO {
  nama?: string | undefined;
  biayaAjb?: number | undefined;
  nomorKtp?: string;
  nomorIjin?: string;
  pics?: PicNotarisDTO[] | undefined;
}

export interface NotarisResponseDTO {
  id: number;
  nama: string;
  biayaAjb: number;
  nomorKtp: string;
  nomorIjin: string;
  pics: PicNotarisDTO[];
  ajbDitangani: AjbDitanganiDTO[];
  createdAt: Date;
}

export type NotarisFilterDTO = BaseFilterDTO;
