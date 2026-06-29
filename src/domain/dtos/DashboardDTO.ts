export interface KavlingRekeningBreakdownDTO {
  rekeningId: number;
  label: string;
  atasNama: string;
  total: number;
  terjual: number;
}

export interface KpiComparisonDTO {
  current: number;
  previous: number;
  changePercent: number | null;
  trend: "up" | "down" | "flat";
}

export interface TrendPointDTO {
  label: string;
  value: number;
}

export interface CollectionTrendPointDTO {
  label: string;
  terkumpul: number;
  menungguKonfirmasi: number;
}

export interface StatusBreakdownDTO {
  status: string;
  label: string;
  count: number;
  nominal?: number;
}

export interface DashboardStatsDTO {
  totalPendapatan: number;
  kavlingTerjual: number;
  totalKavling: number;
  kavlingByRekening: KavlingRekeningBreakdownDTO[];
  tagihanJatuhTempo: number;
  customerJatuhTempo: number;
  proyekAktif: number;
  rataRataProgress: number;
  /** Pendapatan tagihan lunas bulan berjalan (berdasarkan jatuh tempo / tanggal bayar) */
  pendapatanBulanIni: number;
  /** Pendapatan tagihan lunas bulan sebelumnya (berdasarkan jatuh tempo / tanggal bayar) */
  pendapatanBulanLalu: number;
  /** Jumlah penjualan (non-batal) bulan berjalan */
  penjualanBulanIni: number;
  /** Jumlah penjualan (non-batal) bulan sebelumnya */
  penjualanBulanLalu: number;
  /** Tagihan menunggu konfirmasi pembayaran */
  tagihanMenungguKonfirmasi: number;
  tagihanMenungguKonfirmasiNominal: number;
  /** Perbandingan KPI utama */
  kpiComparison: {
    pendapatan: KpiComparisonDTO;
    penjualan: KpiComparisonDTO;
  };
}

export interface RecentTransactionDTO {
  id: string;
  customer: string;
  kavling: string;
  type: string;
  amount: number;
  status: string;
  date: string;
}

export interface ProgressDataDTO {
  kavling: string;
  customer: string;
  progress: number;
  tahap: string;
  isLate: boolean;
}

export interface TopAgentDTO {
  name: string;
  closing: number;
  feeStatus: string;
}

export interface DocumentAlertDTO {
  customer: string;
  kavling: string;
  missing: string[];
}

export interface ProgressRangeBreakdownDTO {
  range: string;
  count: number;
}

export type DashboardKpiPeriod = "month" | "quarter" | "year";

export interface DashboardQueryDTO {
  trendMonths?: number;
  kpiPeriod?: DashboardKpiPeriod;
}

export interface BlokHeatmapDTO {
  blok: string;
  total: number;
  terjual: number;
  available: number;
  booking: number;
  hold: number;
  soldPercent: number;
}

export interface KpiAlertDTO {
  type: "revenue_decline" | "sales_decline";
  message: string;
  severity: "warning" | "critical";
  actionHint: string;
}

export interface DashboardFiltersDTO {
  trendMonths: number;
  kpiPeriod: DashboardKpiPeriod;
  kpiPeriodLabel: string;
  comparisonLabel: string;
}

export interface DrilldownItemDTO {
  id: string;
  label: string;
  sublabel?: string;
  value?: string;
  status?: string;
}

export type DashboardDrilldownCategory =
  | "kavling"
  | "penjualan"
  | "tagihan"
  | "progress";

export interface DashboardDrilldownQueryDTO {
  category: DashboardDrilldownCategory;
  filter?: string;
  blok?: string;
}

/** Baris metrik bulanan untuk dashboard eksekutif */
export interface MonthlyMetricRowDTO {
  month: number;
  monthLabel: string;
  total: number;
  count: number;
}

/** KPI ringkas dashboard eksekutif */
export interface ExecutiveKpiDTO {
  unitTersedia: number;
  akadBulanIni: number;
  unitBookingHariIni: number;
  unitProsesHariIni: number;
  totalUnitKpr: number;
  totalUnitCashBertahap: number;
}

/** Tingkat pemesanan unit per bulan */
export interface BookingRateRowDTO {
  month: number;
  monthLabel: string;
  jumlahPemesanan: number;
  tingkatPersen: number;
}

/** Unit penjualan per hari (booking / proses) */
export interface TodayUnitItemDTO {
  id: string;
  customer: string;
  kavling: string;
  amount: number;
  caraPembayaran?: string;
  waktu: string;
}

/** Ringkasan dashboard eksekutif (layout baru) */
export interface ExecutiveDashboardDTO {
  year: number;
  /** Tanggal referensi data harian (YYYY-MM-DD) */
  todayDate: string;
  kpi: ExecutiveKpiDTO;
  bookingHariIni: TodayUnitItemDTO[];
  prosesHariIni: TodayUnitItemDTO[];
  pendapatanTahunIni: MonthlyMetricRowDTO[];
  akadTahunIni: MonthlyMetricRowDTO[];
  penjualanCashTahunIni: MonthlyMetricRowDTO[];
  tingkatPemesanan: BookingRateRowDTO[];
}

export interface DashboardResponseDTO {
  stats: DashboardStatsDTO;
  recentTransactions: RecentTransactionDTO[];
  progressData: ProgressDataDTO[];
  topAgents: TopAgentDTO[];
  documentAlerts: DocumentAlertDTO[];
  /** Tren pendapatan N bulan terakhir (line chart) */
  revenueTrend: TrendPointDTO[];
  /** Tren penjualan unit N bulan terakhir (line chart) */
  salesTrend: TrendPointDTO[];
  /** Komposisi tagihan per bulan (stacked bar) */
  collectionTrend: CollectionTrendPointDTO[];
  /** Breakdown status kavling (pie chart) */
  kavlingByStatus: StatusBreakdownDTO[];
  /** Breakdown status penjualan (bar chart) */
  penjualanByStatus: StatusBreakdownDTO[];
  /** Breakdown status tagihan (bar chart) */
  tagihanByStatus: StatusBreakdownDTO[];
  /** Distribusi progress proyek (bar chart) */
  progressBreakdown: ProgressRangeBreakdownDTO[];
  /** Heatmap kepadatan kavling per blok */
  blokHeatmap: BlokHeatmapDTO[];
  /** Alert KPI penurunan berturut-turut */
  kpiAlerts: KpiAlertDTO[];
  /** Metadata filter aktif */
  filters: DashboardFiltersDTO;
  /** Dashboard eksekutif — KPI & tabel bulanan */
  executive: ExecutiveDashboardDTO;
}
