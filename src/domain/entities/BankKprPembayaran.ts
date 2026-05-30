import type {
  BankKprPembayaranJenis,
  BankKprPembayaranStatus,
} from "@prisma/client";

export interface BankKprPembayaranEntity {
  id: number;
  penjualanId: number;
  jenis: BankKprPembayaranJenis;
  nominal: number;
  status: BankKprPembayaranStatus;
  buktiPembayaran: string | null;
  tanggalPembayaran: Date | null;
  bsiCmsDilaporkan: boolean;
  bsiCmsDilaporkanAt: Date | null;
  dibayarOlehId: number | null;
  dibayarOleh: { id: number; username: string } | null;
  createdAt: Date;
  updatedAt: Date;
  penjualan?: {
    id: number;
    noTransaksi: string;
    bank: string | null;
    bankKprNamaRekening: string | null;
    bankKprAtasNamaRekening: string | null;
    bankKprNoRekening: string | null;
    customer: { id: number; nama: string };
    kavling: {
      blok: string;
      nomorUnit: string;
      perumahan: { nama: string };
    };
  };
}
