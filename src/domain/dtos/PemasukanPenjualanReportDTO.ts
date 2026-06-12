import type { PaymentMethod, PenjualanStatus } from "@prisma/client";

export interface PemasukanPenjualanReportFilterDTO {
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

export interface PemasukanTerbayarDetailDTO {
  tagihanId: number;
  noTagihan: string;
  nominal: number;
  pembayaran: string;
  jatuhTempo: string;
  status: string;
  fileBukti: string | null;
  fileBuktiList: string[];
  updatedAt: string;
}

export interface PemasukanPenjualanBucketDTO {
  nominal: number;
  terbayar: PemasukanTerbayarDetailDTO[];
  totalTerbayar: number;
  sisa: number;
}

export interface PemasukanPenjualanCicilanDTO extends PemasukanPenjualanBucketDTO {
  /** "Bertahap" | "KPR" — null jika tidak ada skema cicilan (mis. cash keras) */
  skemaPembayaran: string | null;
}

export interface PemasukanPenjualanReportItemDTO {
  penjualanId: number;
  noTransaksi: string;
  customerNama: string;
  kavlingLabel: string;
  blok: string;
  nomorUnit: string;
  perumahanNama: string;
  caraPembayaran: PaymentMethod | null;
  hargaJual: number;
  /** null = tidak ada booking fee, true = lunas, false = belum lunas */
  bookingLunas: boolean | null;
  dp: PemasukanPenjualanBucketDTO;
  cicilan: PemasukanPenjualanCicilanDTO;
}

export interface PemasukanPenjualanReportDTO {
  filters: PemasukanPenjualanReportFilterDTO;
  summary: {
    jumlahPenjualan: number;
    totalBookingNominal: number;
    totalBookingTerbayar: number;
    totalDpNominal: number;
    totalDpTerbayar: number;
    totalCicilanNominal: number;
    totalCicilanTerbayar: number;
  };
  items: PemasukanPenjualanReportItemDTO[];
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}
