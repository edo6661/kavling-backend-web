import type { BaseFilterDTO } from "./BaseFilterDTO.js";
import type { AgentStatus, AgentType } from "@prisma/client";

export interface AgentFilterDTO extends BaseFilterDTO {
  status?: AgentStatus | undefined;
  type?: AgentType | undefined;
}

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
  perusahaanAgentId?: number | undefined;

  feeMarketingPct?: number | undefined;
  feeClosingNominal: number | null; // <-- TAMBAHKAN INI
  potonganPph?: number | undefined;
  pics?: PicAgentDTO[] | undefined;
}

export interface UpdateAgentDTO {
  userId?: number | undefined;
  nik?: string | undefined;
  nama?: string | undefined;
  alamat?: string | undefined;
  noHp?: string | undefined;
  fileSuratPernyataan: string | null;
  defaultSuratPernyataan: string | null;
  email?: string | undefined;
  status?: AgentStatus | undefined;
  perusahaanAgentId?: number | undefined;

  type?: AgentType | undefined;
  namaBank?: string | undefined;
  noRekening?: string | undefined;
  atasNamaRekening?: string | undefined;
  feeMarketingPct?: number | undefined;
  feeClosingNominal: number | null; // <-- TAMBAHKAN INI
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
  fileSuratPernyataan: string | null;
  defaultSuratPernyataan: string | null;

  namaBank: string | null;
  noRekening: string | null;
  atasNamaRekening: string | null;

  feeMarketingPct: number | null;
  feeClosingNominal: number | null; // <-- TAMBAHKAN INI
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
  perusahaanAgentId?: number | undefined;
  ttdData?: string | undefined;
}
