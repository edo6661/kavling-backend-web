import type { BaseFilterDTO } from "./BaseFilterDTO.js";

export interface CreateBankRekeningPtDTO {
  namaBank: string;
  noRekening: string;
  atasNama: string;
}

export interface UpdateBankRekeningPtDTO {
  namaBank?: string | undefined;
  noRekening?: string | undefined;
  atasNama?: string | undefined;
}

export interface BankRekeningPtResponseDTO {
  id: number;
  namaBank: string;
  noRekening: string;
  atasNama: string;
  createdAt: Date;
}

export type BankRekeningPtFilterDTO = BaseFilterDTO;
