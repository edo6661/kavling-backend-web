import type { BaseFilterDTO } from "./BaseFilterDTO.js";

export interface CreateBankRekeningPtDTO {
  perumahanId: number;
  namaBank: string;
  noRekening: string;
  atasNama: string;
}

export interface UpdateBankRekeningPtDTO {
  perumahanId?: number | undefined;
  namaBank?: string | undefined;
  noRekening?: string | undefined;
  atasNama?: string | undefined;
}

export interface BankRekeningPtResponseDTO {
  id: number;
  perumahanId: number;
  perumahan?: string;
  namaBank: string;
  noRekening: string;
  atasNama: string;
  createdAt: Date;
}

export type BankRekeningPtFilterDTO = BaseFilterDTO;
