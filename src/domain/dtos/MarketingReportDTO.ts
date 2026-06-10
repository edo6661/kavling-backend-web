export interface MarketingReportFilterDTO {
  startDate?: string;
  endDate?: string;
  agentId?: number;
  perusahaanAgentId?: number;
  perumahanId?: number;
}

export interface MarketingReportAgentRowDTO {
  agentId: number;
  nama: string;
  perusahaanNama: string | null;
  booked: number;
  proses: number;
  lunas: number;
  batal: number;
  totalClosing: number;
  konversiRate: number;
  totalFeeBooking: number;
  totalFeeClosing: number;
  totalFeeMarketing: number;
  feeSudahDibayar: number;
  feeBelumDibayar: number;
}

export interface MarketingReportPerusahaanRowDTO {
  perusahaanAgentId: number;
  nama: string;
  jumlahAgent: number;
  totalClosing: number;
  totalFee: number;
  feeSudahDibayar: number;
}

export interface MarketingReportFeeItemDTO {
  feeId: number;
  penjualanId: number;
  noTransaksi: string;
  tanggal: string;
  penjualanStatus: string;
  customerNama: string;
  kavlingLabel: string;
  agentNama: string;
  bookingNominal: number;
  bookingSudahDibayar: boolean;
  closingNominal: number;
  closingSudahDibayar: boolean;
  marketingNominal: number;
  marketingSudahDibayar: boolean;
  totalFee: number;
}

export interface MarketingReportDTO {
  filters: MarketingReportFilterDTO;
  summary: {
    totalKavling: number;
    kavlingTerjual: number;
    jumlahPenjualan: number;
    penjualanPeriode: number;
    totalAgentAktif: number;
    totalFeeBooking: number;
    totalFeeClosing: number;
    totalFeeMarketing: number;
    feeBookingSudahDibayar: number;
    feeClosingSudahDibayar: number;
    feeMarketingSudahDibayar: number;
    feeBelumDibayar: number;
  };
  byStatus: { status: string; label: string; count: number }[];
  penjualanBulanan: {
    bulan: string;
    bulanLabel: string;
    count: number;
    nominal: number;
  }[];
  byAgent: MarketingReportAgentRowDTO[];
  byPerusahaan: MarketingReportPerusahaanRowDTO[];
  feeItems: MarketingReportFeeItemDTO[];
}
