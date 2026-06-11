import type { PaymentMethod, PenjualanStatus } from "@prisma/client";

export interface RekapPembayaranReportFilterDTO {
  perumahanId?: number;
  blok?: string;
  status?: PenjualanStatus | "ALL";
  caraPembayaran?: PaymentMethod;
  startDate?: string;
  endDate?: string;
}

export interface RekapPembayaranReportItemDTO {
  penjualanId: number;
  noTransaksi: string;
  customerNama: string;
  kavlingLabel: string;
  blok: string;
  nomorUnit: string;
  perumahanNama: string;
  hargaJual: number;
  dp: number;
  sisaPembayaran: number;
  dpTerbayar: number[];
  cicilanTerbayar: number[];
  totalDpTerbayar: number;
  totalCicilanTerbayar: number;
}

export interface RekapPembayaranReportDTO {
  filters: RekapPembayaranReportFilterDTO;
  summary: {
    jumlahPenjualan: number;
    totalHargaJual: number;
    totalDp: number;
    totalSisaPembayaran: number;
    totalDpTerbayar: number;
    totalCicilanTerbayar: number;
  };
  items: RekapPembayaranReportItemDTO[];
}
