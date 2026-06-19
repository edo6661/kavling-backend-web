import type { PaymentMethod, PenjualanStatus } from "@prisma/client";

export interface RekapPemasukanReportFilterDTO {
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

/** Nilai uang riil yang diterima; null jika belum ada definisi kalkulasi. */
export interface RekapPemasukanKategoriDTO {
  key: string;
  label: string;
  terbayar: number | null;
  calculable: boolean;
  note?: string;
}

export interface RekapPemasukanSkemaDTO {
  dp: RekapPemasukanKategoriDTO;
  cicilan: RekapPemasukanKategoriDTO;
  cicilanDp?: RekapPemasukanKategoriDTO;
  cicilanRumah?: RekapPemasukanKategoriDTO;
}

export interface RekapPemasukanDetailItemDTO {
  penjualanId: number;
  noTransaksi: string;
  customerNama: string;
  kavlingLabel: string;
  caraPembayaran: PaymentMethod | null;
  pembiayaan: string | null;
  bookingFee: number;
  dp: number;
  cicilanCashBertahap: number;
  cicilanDp: number;
  cicilanRumah: number;
  dpKpr: number;
  cicilanKpr: number;
  totalTerima: number;
}

export interface RekapPemasukanReportDTO {
  filters: RekapPemasukanReportFilterDTO;
  ringkasan: RekapPemasukanKategoriDTO[];
  kpr: RekapPemasukanSkemaDTO;
  cashBertahap: RekapPemasukanSkemaDTO;
  totalTerima: number;
  jumlahPenjualan: number;
  items: RekapPemasukanDetailItemDTO[];
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}
