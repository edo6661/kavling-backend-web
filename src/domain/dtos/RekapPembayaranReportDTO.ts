import type { PaymentMethod, PenjualanStatus } from "@prisma/client";

export interface RekapPembayaranReportFilterDTO {
  perumahanId?: number;
  blok?: string;
  status?: PenjualanStatus | "ALL";
  caraPembayaran?: PaymentMethod;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface RekapPembayaranBucketDTO {
  utama: number;
  terbayar: number[];
}

export interface RekapPembayaranPemasukanDTO {
  booking: RekapPembayaranBucketDTO;
  dp: RekapPembayaranBucketDTO;
  cicilanCashBertahap: RekapPembayaranBucketDTO;
  cicilanPencairanKpr: RekapPembayaranBucketDTO;
}

export interface RekapPembayaranPengeluaranNotarisDTO {
  biayaNotaris: RekapPembayaranBucketDTO;
  bphtb: RekapPembayaranBucketDTO;
  pph: RekapPembayaranBucketDTO;
}

export interface RekapPembayaranPengeluaranBankDTO {
  biayaKpr: RekapPembayaranBucketDTO;
  biayaAppraisal: RekapPembayaranBucketDTO;
}

export interface RekapPembayaranPengeluaranProyekDTO {
  material: RekapPembayaranBucketDTO;
  upah: RekapPembayaranBucketDTO;
}

export interface RekapPembayaranMarketingDTO {
  marketingFee: RekapPembayaranBucketDTO;
  closingFee: RekapPembayaranBucketDTO;
  netSetelahPotonganPph: RekapPembayaranBucketDTO;
  potonganPph: RekapPembayaranBucketDTO;
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
  /** @deprecated Gunakan pemasukan.dp */
  dp: number;
  /** @deprecated Gunakan pemasukan.cicilan* */
  sisaPembayaran: number;
  /** @deprecated Gunakan pemasukan.dp.terbayar */
  dpTerbayar: number[];
  /** @deprecated Gunakan pemasukan.cicilan*.terbayar */
  cicilanTerbayar: number[];
  /** @deprecated */
  totalDpTerbayar: number;
  /** @deprecated */
  totalCicilanTerbayar: number;
  pemasukan: RekapPembayaranPemasukanDTO;
  pengeluaranNotaris: RekapPembayaranPengeluaranNotarisDTO;
  pengeluaranBank: RekapPembayaranPengeluaranBankDTO;
  pengeluaranProyek: RekapPembayaranPengeluaranProyekDTO;
  marketing: RekapPembayaranMarketingDTO;
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
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}
