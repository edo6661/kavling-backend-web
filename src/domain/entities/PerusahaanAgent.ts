export interface PerusahaanAgentEntity {
  id: number;
  nama: string;
  npwp: string | null;
  namaBank: string | null;
  noRekening: string | null;
  atasNamaRekening: string | null;
  feeMarketingPct: number | null;
  feeClosingNominal: number | null;
  potonganPph: number | null;
  isPkp: boolean;
  akte: string | null;
  createdAt: Date;
  updatedAt: Date;
}
