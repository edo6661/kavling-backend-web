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
  potonganPph: number | null;

  fileKtp: string | null;
  fileNpwp: string | null;
  kwitansiBookingFee: string | null;
  fileSuratPernyataan: string | null; // <-- TAMBAHKAN INI
  fileSuratKeterangan: string | null;
  fileKtpDirektur: string | null;
  fileNpwpPerusahaan: string | null;
  hasAccount: boolean;
  pics: PicAgentEntity[];
  penjualan?: PenjualanAgentEntity[];
  createdAt: Date;
  updatedAt: Date;
}
