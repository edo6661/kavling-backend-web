import type { BaseFilterDTO } from "./BaseFilterDTO.js";

export interface CreateCustomerDTO {
  nikKtp: string;
  nama: string;
  noHp: string;
  email?: string;
  pekerjaan?: string;
  perusahaan?: string;
  bank?: string;
  alamatKtp: string;
  alamatTinggal?: string;
  alamatKoresponden?: string;
}

export interface UpdateCustomerDTO extends Partial<CreateCustomerDTO> {
  fileKtp?: string;
  fileKk?: string;
  fileNpwp?: string;
  userId?: number;
}

export interface CustomerResponseDTO {
  id: number;
  nikKtp: string;
  nama: string;
  noHp: string;
  email: string | null;
  pekerjaan: string | null;
  perusahaan: string | null;
  bank: string | null;
  alamatKtp: string;
  alamatTinggal: string | null;
  alamatKoresponden: string | null;
  fileKtp: string | null;
  fileKk: string | null;
  fileNpwp: string | null;
  hasAccount: boolean;
  createdAt: Date;
}

export type CustomerFilterDTO = BaseFilterDTO;
