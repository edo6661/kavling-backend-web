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
  akte: string | null;
  createdAt: Date;
  updatedAt: Date;
}
