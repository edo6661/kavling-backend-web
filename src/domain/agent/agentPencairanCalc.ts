import { effectiveTagihanTujuan } from "../tagihan/tagihanTujuan.js";

export interface AgentPencairanCalcInput {
  agent: {
    feeMarketingPct: number | null;
    feeClosingNominal: number | null;
    potonganPph: number | null;
  };
  feeAgent?: {
    closingNominal: number | null;
  } | null;
  nilaiAjb: number;
  tagihanList: Array<{
    tujuan?: string | null;
    pembayaran: string;
    status: string;
  }>;
}

export interface AgentPencairanCalcResult {
  bookingFeePaid: boolean;
  closingNominal: number;
  marketingNominal: number;
  potonganPph: number;
  totalNominal: number;
  eligible: boolean;
}

export function isBookingFeePaid(
  tagihanList: AgentPencairanCalcInput["tagihanList"],
): boolean {
  return tagihanList.some(
    (t) =>
      effectiveTagihanTujuan(t as Parameters<typeof effectiveTagihanTujuan>[0]) ===
        "BOOKING_FEE" && t.status === "LUNAS",
  );
}

export function calcAgentPencairanAmounts(
  input: AgentPencairanCalcInput,
): AgentPencairanCalcResult {
  const bookingFeePaid = isBookingFeePaid(input.tagihanList);
  const nilaiAjb = Number(input.nilaiAjb) || 0;
  const feeMarketingPct = Number(input.agent.feeMarketingPct) || 0;
  const potonganPphPct = Number(input.agent.potonganPph) || 0;

  const closingNominal = bookingFeePaid
    ? Number(input.feeAgent?.closingNominal) ||
      Number(input.agent.feeClosingNominal) ||
      0
    : 0;
  const marketingNominal =
    nilaiAjb > 0 ? nilaiAjb * (feeMarketingPct / 100) : 0;
  const potonganPph =
    (closingNominal + marketingNominal) * (potonganPphPct / 100);
  const totalNominal = closingNominal + marketingNominal - potonganPph;
  const eligible =
    (bookingFeePaid || nilaiAjb > 0) && totalNominal > 0;

  return {
    bookingFeePaid,
    closingNominal,
    marketingNominal,
    potonganPph,
    totalNominal,
    eligible,
  };
}
