import type { BaseFilterDTO } from "./BaseFilterDTO.js";

export interface CreateCustomerDTO {
  userId?: number | undefined;
  nikKtp: string;
  nama: string;
  noHp: string;
  email?: string | undefined;
  pekerjaan?: string | undefined;
  perusahaan?: string | undefined;
  bank?: string | undefined;
  alamatKtp: string;
  alamatTinggal?: string | undefined;
  alamatKoresponden?: string | undefined;
}

export interface UpdateCustomerDTO {
  userId?: number | undefined;
  nikKtp?: string | undefined;
  nama?: string | undefined;
  noHp?: string | undefined;
  email?: string | undefined;
  pekerjaan?: string | undefined;
  perusahaan?: string | undefined;
  bank?: string | undefined;
  alamatKtp?: string | undefined;
  alamatTinggal?: string | undefined;
  alamatKoresponden?: string | undefined;
  fileKtp?: string | undefined;
  fileKk?: string | undefined;
  fileNpwp?: string | undefined;
  dokumenLainnya?: unknown;
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

  dokumenLainnya?: any;

  hasAccount: boolean;
  createdAt: Date;
}

export interface CustomerFilterDTO extends BaseFilterDTO {
  /** Filter customer yang pernah diclosing oleh agent tertentu */
  agentId?: number;
}

export interface CustomerLoginInput {
  username: string;
  password: string;
}
