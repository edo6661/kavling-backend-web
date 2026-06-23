import type { AgentStatus } from "@prisma/client";
import type { AgentType } from "@prisma/client";

export interface PicAgentEntity {
  id: number;
  agentId: number;
  nama: string;
  noHp: string;
  alamat: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PenjualanAgentEntity {
  id: number;
  noTransaksi: string;
  tanggal: Date;
  hargaJual: number;
  status: string;
  /** Penjualan BATAL di relasi agent hanya disertakan jika booking fee sudah lunas */
  bookingFeeLunasBatal?: boolean;
  customer: { nama: string } | null;
  kavling: {
    blok: string;
    nomorUnit: string;
    perumahan: { nama: string } | null;
  } | null;
}
export interface AgentEntity {
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
  feeClosingNominal: number | null;
  potonganPph: number | null;
  isPkp: boolean;
  isInHouse: boolean;

  fileKtp: string | null;
  fileNpwp: string | null;
  kwitansiBookingFee: string | null;
  fileSuratPernyataan: string | null;
  defaultSuratPernyataan: string | null;
  fileSuratKeterangan: string | null;
  fileKtpDirektur: string | null;
  fileNpwpPerusahaan: string | null;
  hasAccount: boolean;
  pics: PicAgentEntity[];
  perusahaanAgentId: number | null;
  perusahaanAgent?: {
    id: number;
    nama: string;
    npwp?: string | null;
    namaBank?: string | null;
    noRekening?: string | null;
    atasNamaRekening?: string | null;
    feeMarketingPct?: number | null;
    feeClosingNominal?: number | null;
    potonganPph?: number | null;
    isPkp?: boolean;
    akte?: string | null;
  } | null | undefined;
  penjualan?: PenjualanAgentEntity[];
  createdAt: Date;
  updatedAt: Date;
}
