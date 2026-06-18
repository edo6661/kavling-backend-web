import type { AgentPencairanStatus } from "../entities/AgentPencairan.js";

export interface AgentPencairanFilterDTO {
  status?: AgentPencairanStatus;
  search?: string;
  agentId?: number;
  feeAgentId?: number;
}

export interface CreateAgentPencairanDTO {
  feeAgentId: number;
  diajukanOlehId: number;
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
