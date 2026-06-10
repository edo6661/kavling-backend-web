import type {
  PaymentMethod,
  PaymentStatus,
  PenjualanStatus,
  TagihanTujuan,
} from "@prisma/client";

export interface PenjualanReportFilterDTO {
  perumahanId?: number;
  blok?: string;
  status?: PenjualanStatus | "ALL";
  caraPembayaran?: PaymentMethod;
  agentId?: number;
  startDate?: string;
  endDate?: string;
}

export interface PenjualanReportTagihanDTO {
  id: number;
  noTagihan: string;
  nominal: number;
  jatuhTempo: string;
  status: PaymentStatus;
  tujuan: TagihanTujuan;
  tujuanLabel: string;
  hariTerlambat: number;
}

export interface PenjualanReportItemDTO {
  penjualanId: number;
  noTransaksi: string;
  tanggal: string;
  status: PenjualanStatus;
  caraPembayaran: string | null;
  hargaJual: number;
  customerNama: string;
  agentNama: string | null;
  kavlingLabel: string;
  blok: string;
  nomorUnit: string;
  perumahanNama: string;
  totalTagihan: number;
  totalTerbayar: number;
  totalPiutang: number;
  persentaseTerbayar: number;
  jumlahTagihanLunas: number;
  jumlahTagihanBelum: number;
  tagihan: PenjualanReportTagihanDTO[];
}

export interface PenjualanAgingBucketDTO {
  bucket: string;
  label: string;
  jumlahTagihan: number;
  totalNominal: number;
}

export interface PenjualanStatusRowDTO {
  status: string;
  label: string;
  count: number;
  nominal: number;
}

export interface PenjualanBlokRowDTO {
  blok: string;
  count: number;
  nominal: number;
}

export interface PenjualanReportSummaryDTO {
  jumlahPenjualan: number;
  totalNilaiPenjualan: number;
  totalTerbayar: number;
  totalPiutang: number;
  tagihanJatuhTempo: number;
  tagihanMenungguKonfirmasi: number;
  persentaseKoleksi: number;
}

export interface PenjualanReportDTO {
  filters: PenjualanReportFilterDTO;
  summary: PenjualanReportSummaryDTO;
  aging: PenjualanAgingBucketDTO[];
  byStatus: PenjualanStatusRowDTO[];
  byBlok: PenjualanBlokRowDTO[];
  items: PenjualanReportItemDTO[];
}
