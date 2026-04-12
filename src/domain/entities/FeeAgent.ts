export interface FeeAgentEntity {
  id: number;
  agentId: number;
  penjualanId: number;
  bookingNominal: number | null;
  bookingTanggal: Date | null;
  bookingBukti: string | null;
  closingNominal: number | null;
  closingTanggal: Date | null;
  closingBukti: string | null;
  marketingNominal: number | null;
  marketingTanggal: Date | null;
  marketingBukti: string | null;
  createdAt: Date;
  updatedAt: Date;
}
