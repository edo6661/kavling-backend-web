import type { AgentPencairanStatus, AgentPencairanTahap } from "../entities/AgentPencairan.js";

export interface AgentPencairanFilterDTO {
  status?: AgentPencairanStatus;
  search?: string;
  agentId?: number;
  feeAgentId?: number;
}

export interface CreateAgentPencairanDTO {
  feeAgentId: number;
  includeClosing: boolean;
  includeMarketing: boolean;
  diajukanOlehId: number;
}

export interface PersistAgentPencairanDTO {
  feeAgentId: number;
  penjualanId: number;
  agentId: number;
  tahap: AgentPencairanTahap;
  diajukanOlehId: number;
  closingNominal: number;
  marketingNominal: number;
  potonganPph: number;
  totalNominal: number;
}

export interface BayarAgentPencairanDTO {
  id: number;
  dibayarOlehId: number;
  buktiPembayaran: string;
  tanggalPembayaran?: Date;
}

export interface SetAgentBsiCmsDilaporkanDTO {
  ids: number[];
  dilaporkan: boolean;
}
