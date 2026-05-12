import type { BaseFilterDTO } from "./BaseFilterDTO.js";
import type { AgentStatus, AgentType } from "@prisma/client";

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
  type?: AgentType | undefined;
  namaBank?: string | undefined;
  noRekening?: string | undefined;
  atasNamaRekening?: string | undefined;
  feeMarketingPct?: number | undefined;
  potonganPph?: number | undefined;
  pics?: PicAgentDTO[] | undefined;
}

export interface UpdateAgentDTO {
  userId?: number | undefined;
  nik?: string | undefined;
  nama?: string | undefined;
  alamat?: string | undefined;
  noHp?: string | undefined;
  email?: string | undefined;
  status?: AgentStatus | undefined;
  type?: AgentType | undefined;
  namaBank?: string | undefined;
  noRekening?: string | undefined;
  atasNamaRekening?: string | undefined;
  feeMarketingPct?: number | undefined;
  potonganPph?: number | undefined;
  fileKtp?: string | undefined;
  fileNpwp?: string | undefined;
  kwitansiBookingFee?: string | undefined;
  fileSuratKeterangan?: string | undefined;
  fileKtpDirektur?: string | undefined;
  fileNpwpPerusahaan?: string | undefined;
  pics?: PicAgentDTO[] | undefined;
}

export interface AgentResponseDTO {
  id: number;
  userId: number | null;
  nik: string;
  kodeSales: string | null;
  nama: string;
  alamat: string | null;
  noHp: string;
  email: string | null;
  status: AgentStatus;
  type: AgentType;

  namaBank: string | null;
  noRekening: string | null;
  atasNamaRekening: string | null;

  feeMarketingPct: number | null;
  potonganPph: number | null;

  fileKtp: string | null;
  fileNpwp: string | null;
  kwitansiBookingFee: string | null;
  fileSuratKeterangan: string | null;
  fileKtpDirektur: string | null;
  fileNpwpPerusahaan: string | null;

  hasAccount: boolean;
  pics: PicAgentDTO[];
  createdAt: Date;
}
export type AgentFilterDTO = BaseFilterDTO;

export interface RegisterAgentDTO {
  nik: string;
  nama: string;
  noHp: string;
  email: string;
  password: string;
  alamat?: string | undefined;
  type?: AgentType | undefined;
  namaBank?: string | undefined;
  noRekening?: string | undefined;
  atasNamaRekening?: string | undefined;
}
