import type { BaseFilterDTO } from "./BaseFilterDTO.js";

export interface CreateCustomerDTO {
  nikKtp: string;
  nama: string;
  noHp: string;
  email?: string | undefined;
  pekerjaan?: string | undefined;
  perusahaan?: string | undefined;
  bank?: string | undefined;
  alamatKoresponden?: string | undefined;
  alamatKtp: string;
  alamatTinggal?: string | undefined;
}

export interface UpdateCustomerDTO {
  nikKtp?: string | undefined;
  nama?: string | undefined;
  userId?: number | undefined;
  noHp?: string | undefined;
  email?: string | undefined;
  pekerjaan?: string | undefined;
  perusahaan?: string | undefined;
  bank?: string | undefined;
  alamatKoresponden?: string | undefined;
  alamatKtp?: string | undefined;
  alamatTinggal?: string | undefined;
  fileKtp?: string | undefined;
  fileKk?: string | undefined;
  fileNpwp?: string | undefined;
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
  alamatKoresponden: string | null;
  alamatKtp: string;
  alamatTinggal: string | null;
  fileKtp: string | null;
  fileKk: string | null;
  fileNpwp: string | null;
  userId: number | null;
  hasAccount: boolean;
  createdAt: Date;
}

export type CustomerFilterDTO = BaseFilterDTO;
