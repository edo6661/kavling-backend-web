import type { BaseFilterDTO } from "./BaseFilterDTO.js";

export interface CreatePerumahanDTO {
  nama: string;
  logo: string;
  alamat: string;
}

export interface UpdatePerumahanDTO {
  nama?: string | undefined;
  logo?: string | undefined;
  alamat?: string | undefined;
}

export interface PerumahanResponseDTO {
  id: number;
  nama: string;
  logo: string;
  alamat: string;
  createdAt: Date;
}

export type PerumahanFilterDTO = BaseFilterDTO;
