export interface KavlingRekeningBreakdownDTO {
  rekeningId: number;
  label: string;
  atasNama: string;
  total: number;
  terjual: number;
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

export interface DashboardResponseDTO {
  stats: DashboardStatsDTO;
  recentTransactions: RecentTransactionDTO[];
  progressData: ProgressDataDTO[];
  topAgents: TopAgentDTO[];
  documentAlerts: DocumentAlertDTO[];
}
