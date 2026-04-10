import type { AgentStatus } from "@prisma/client";

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
  nik: string;
  kodeSales: string | null;
  nama: string;
  alamat: string | null;
  noHp: string;
  email: string | null;
  status: AgentStatus;
  pics: PicAgentEntity[];
  penjualan?: PenjualanAgentEntity[];
  createdAt: Date;
  updatedAt: Date;
}
