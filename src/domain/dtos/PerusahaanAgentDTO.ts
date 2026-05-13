import type { BaseFilterDTO } from "./BaseFilterDTO.js";

export interface CreatePerusahaanAgentDTO {
  nama: string;
}

export interface UpdatePerusahaanAgentDTO {
  nama?: string;
  akte?: string;
}

export type PerusahaanAgentFilterDTO = BaseFilterDTO;
