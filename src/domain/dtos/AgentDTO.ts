import type { BaseFilterDTO } from "./BaseFilterDTO.js";
import type { AgentStatus } from "@prisma/client";

export interface PicAgentDTO {
  id?: number | undefined;
  nama: string;
  noHp: string;
  alamat?: string | undefined;
}

export interface CreateAgentDTO {
  nik: string;
  nama: string;
  alamat?: string | undefined;
  noHp: string;
  email?: string | undefined;
  status?: AgentStatus | undefined;
  pics?: PicAgentDTO[] | undefined;
}

export interface UpdateAgentDTO {
  nik?: string | undefined;
  nama?: string | undefined;
  alamat?: string | undefined;
  noHp?: string | undefined;
  email?: string | undefined;
  status?: AgentStatus | undefined;
  pics?: PicAgentDTO[] | undefined;
}

export interface AgentResponseDTO {
  id: number;
  nik: string;
  kodeSales: string | null;
  nama: string;
  alamat: string | null;
  noHp: string;
  email: string | null;
  status: AgentStatus;
  pics: PicAgentDTO[];
  createdAt: Date;
}

export type AgentFilterDTO = BaseFilterDTO;
