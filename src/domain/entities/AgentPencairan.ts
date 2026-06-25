export type AgentPencairanStatus = "MENUNGGU_PEMBAYARAN" | "SUDAH_DIBAYAR";
export type AgentPencairanTahap = "PPJB" | "AJB";

export interface AgentPencairanEntity {
  id: number;
  feeAgentId: number;
  penjualanId: number;
  agentId: number;
  tahap: AgentPencairanTahap;
  closingNominal: number;
  marketingNominal: number;
  potonganPph: number;
  totalNominal: number;
  status: AgentPencairanStatus;
  fileInvoice: string | null;
  fileInvoiceList: string[];
  buktiPembayaran: string | null;
  tanggalPembayaran: Date | null;
  bsiCmsDilaporkan: boolean;
  bsiCmsDilaporkanAt: Date | null;
  diajukanOlehId: number;
  dibayarOlehId: number | null;
  createdAt: Date;
  updatedAt: Date;
  diajukanOleh?: { id: number; username: string };
  dibayarOleh?: { id: number; username: string } | null;
  agent?: {
    id: number;
    nama: string;
    namaBank: string | null;
    noRekening: string | null;
    atasNamaRekening: string | null;
  };
  penjualan?: {
    id: number;
    noTransaksi: string;
    customer: { id: number; nama: string };
    kavling: {
      blok: string;
      nomorUnit: string;
      perumahan: { nama: string };
      rekeningTujuan: {
        id: number;
        namaBank: string;
        noRekening: string;
        atasNama: string;
      } | null;
    };
  };
}
