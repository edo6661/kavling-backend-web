import type { BaseFilterDTO } from "./BaseFilterDTO.js";

export interface CreatePerusahaanAgentDTO {
  nama: string;
  npwp?: string;
  namaBank?: string;
  noRekening?: string;
  atasNamaRekening?: string;
  feeMarketingPct?: number;
  feeClosingNominal?: number;
  potonganPph?: number;
}

export interface UpdatePerusahaanAgentDTO extends Partial<CreatePerusahaanAgentDTO> {
  akte?: string;
}

export type PerusahaanAgentFilterDTO = BaseFilterDTO;
