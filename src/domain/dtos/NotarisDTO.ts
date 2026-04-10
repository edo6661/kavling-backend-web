import type { BaseFilterDTO } from "./BaseFilterDTO.js";

export interface PicNotarisDTO {
  id?: number | undefined;
  nama: string;
  noHp: string;
  alamat?: string | undefined;
}

export interface CreateNotarisDTO {
  nama: string;
  biayaAjb: number;
  pics?: PicNotarisDTO[] | undefined;
}

export interface UpdateNotarisDTO {
  nama?: string | undefined;
  biayaAjb?: number | undefined;
  pics?: PicNotarisDTO[] | undefined;
}

export interface NotarisResponseDTO {
  id: number;
  nama: string;
  biayaAjb: number;
  pics: PicNotarisDTO[];
  createdAt: Date;
}

export type NotarisFilterDTO = BaseFilterDTO;
