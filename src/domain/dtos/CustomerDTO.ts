import type { BaseFilterDTO } from "./BaseFilterDTO.js";

export interface CreateCustomerDTO {
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

export interface UpdateCustomerDTO extends Partial<CreateCustomerDTO> {
  fileKtp?: string | undefined;
  fileKk?: string | undefined;
  fileNpwp?: string | undefined;
  userId?: number | undefined;
  dokumenLainnya?: any;
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

export type CustomerFilterDTO = BaseFilterDTO;
