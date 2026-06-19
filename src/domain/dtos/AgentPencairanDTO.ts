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
  invoiceFileBuffers?: Buffer[];
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
  fileInvoice?: string | null;
  fileInvoiceList?: string[] | null;
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
