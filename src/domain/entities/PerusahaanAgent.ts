export interface PerusahaanAgentEntity {
  id: number;
  nama: string;
  npwp: string | null;
  namaBank: string | null;
  noRekening: string | null;
  atasNamaRekening: string | null;
  akte: string | null;
  createdAt: Date;
  updatedAt: Date;
}
