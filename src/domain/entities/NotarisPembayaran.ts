import type {
  NotarisPembayaranJenis,
  NotarisPembayaranStatus,
} from "@prisma/client";

export interface NotarisPembayaranEntity {
  id: number;
  penjualanId: number;
  jenis: NotarisPembayaranJenis;
  nominal: number;
  status: NotarisPembayaranStatus;
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
    customer: { id: number; nama: string };
    kavling: {
      blok: string;
      nomorUnit: string;
      perumahan: { nama: string };
    };
    detailKavlingPajak: {
      notaris: {
        id: number;
        nama: string;
        namaBank: string | null;
        noRekening: string | null;
        atasNamaRekening: string | null;
      } | null;
    } | null;
  };
}
