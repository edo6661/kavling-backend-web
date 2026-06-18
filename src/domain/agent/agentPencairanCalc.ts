import { effectiveTagihanTujuan } from "../tagihan/tagihanTujuan.js";

export type AgentPencairanTahap = "PPJB" | "AJB";

/** Komisi cash yang boleh dicairkan per tahap (PPJB / AJB) */
export const KOMISI_CASH_PPJB_RATIO = 0.5;

export interface AgentPencairanCalcInput {
  tahap: AgentPencairanTahap;
  penjualanStatus?: string | null;
  caraPembayaran: string | null;
  hargaJual: number;
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
  tahap: AgentPencairanTahap;
  bookingFeePaid: boolean;
  closingNominal: number;
  marketingNominal: number;
  potonganPph: number;
  totalNominal: number;
  eligible: boolean;
}

export function isCashPayment(
  caraPembayaran: string | null | undefined,
): boolean {
  const key = (caraPembayaran ?? "").replace(/\s/g, "_").toUpperCase();
  return key === "CASH_KERAS" || key === "CASH_BERTAHAP";
}

export function isKprPayment(
  caraPembayaran: string | null | undefined,
): boolean {
  const key = (caraPembayaran ?? "").replace(/\s/g, "_").toUpperCase();
  return key === "KPR";
}

export function isPenjualanBatal(
  status: string | null | undefined,
): boolean {
  return (status ?? "").toUpperCase() === "BATAL";
}

export function hasPpjbComplete(
  progress: { filePpjb?: string | null } | null | undefined,
): boolean {
  return !!progress?.filePpjb;
}

export function hasSp3kComplete(
  progress: { fileSp3k?: string | null } | null | undefined,
): boolean {
  return !!progress?.fileSp3k;
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

export function getMarketingBase(nilaiAjb: number, hargaJual: number): number {
  return nilaiAjb > 0 ? nilaiAjb : hargaJual;
}

export function calcFullMarketingFee(
  base: number,
  feeMarketingPct: number,
): number {
  return base > 0 && feeMarketingPct > 0 ? base * (feeMarketingPct / 100) : 0;
}

export function getClosingFeeAmount(
  bookingPaid: boolean,
  feeAgentClosing: number | null | undefined,
  agentClosing: number | null | undefined,
): number {
  if (!bookingPaid) return 0;
  return Number(feeAgentClosing) || Number(agentClosing) || 0;
}

export function determineNextPencairanTahap(input: {
  penjualanStatus?: string | null;
  isCash: boolean;
  hasPpjb: boolean;
  hasSp3k: boolean;
  hasAjb: boolean;
  bookingPaid: boolean;
  existingTahaps: AgentPencairanTahap[];
  ppjbSudahDibayar: boolean;
}): AgentPencairanTahap | null {
  const {
    penjualanStatus,
    isCash,
    hasPpjb,
    hasSp3k,
    hasAjb,
    bookingPaid,
    existingTahaps,
    ppjbSudahDibayar,
  } = input;

  if (isPenjualanBatal(penjualanStatus)) {
    if (bookingPaid && !existingTahaps.includes("PPJB")) {
      return "PPJB";
    }
    return null;
  }

  if (isCash) {
    if (hasPpjb && bookingPaid && !existingTahaps.includes("PPJB")) {
      return "PPJB";
    }
    if (hasAjb && ppjbSudahDibayar && !existingTahaps.includes("AJB")) {
      return "AJB";
    }
    return null;
  }

  if (hasSp3k && bookingPaid && !existingTahaps.includes("PPJB")) {
    return "PPJB";
  }
  if (hasAjb && ppjbSudahDibayar && !existingTahaps.includes("AJB")) {
    return "AJB";
  }
  return null;
}

export function calcAgentPencairanAmounts(
  input: AgentPencairanCalcInput,
): AgentPencairanCalcResult {
  const bookingFeePaid = isBookingFeePaid(input.tagihanList);
  const isCash = isCashPayment(input.caraPembayaran);
  const isBatal = isPenjualanBatal(input.penjualanStatus);
  const nilaiAjb = Number(input.nilaiAjb) || 0;
  const hargaJual = Number(input.hargaJual) || 0;
  const feeMarketingPct = Number(input.agent.feeMarketingPct) || 0;
  const potonganPphPct = Number(input.agent.potonganPph) || 0;

  let closingNominal = 0;
  let marketingNominal = 0;

  const closingFull = getClosingFeeAmount(
    bookingFeePaid,
    input.feeAgent?.closingNominal,
    input.agent.feeClosingNominal,
  );

  if (input.tahap === "PPJB") {
    closingNominal = closingFull;
    if (isCash && !isBatal) {
      const base = getMarketingBase(0, hargaJual);
      const fullMarketing = calcFullMarketingFee(base, feeMarketingPct);
      marketingNominal = fullMarketing * KOMISI_CASH_PPJB_RATIO;
    }
  } else {
    const base = getMarketingBase(nilaiAjb, hargaJual);
    const fullMarketing = calcFullMarketingFee(base, feeMarketingPct);

    if (isCash) {
      marketingNominal = fullMarketing * KOMISI_CASH_PPJB_RATIO;
    } else {
      marketingNominal = nilaiAjb > 0 ? fullMarketing : 0;
    }
  }

  const potonganPph =
    (closingNominal + marketingNominal) * (potonganPphPct / 100);
  const totalNominal = closingNominal + marketingNominal - potonganPph;

  return {
    tahap: input.tahap,
    bookingFeePaid,
    closingNominal,
    marketingNominal,
    potonganPph,
    totalNominal,
    eligible: totalNominal > 0,
  };
}

export function isPencairanTahapEligible(
  tahap: AgentPencairanTahap,
  input: Omit<AgentPencairanCalcInput, "tahap"> & {
    hasPpjb: boolean;
    hasSp3k: boolean;
    ppjbSudahDibayar: boolean;
  },
): boolean {
  const isCash = isCashPayment(input.caraPembayaran);
  const isBatal = isPenjualanBatal(input.penjualanStatus);
  const bookingPaid = isBookingFeePaid(input.tagihanList);
  const hasAjb = Number(input.nilaiAjb) > 0;

  if (tahap === "PPJB") {
    if (isBatal) {
      if (!bookingPaid) return false;
    } else if (isCash) {
      if (!input.hasPpjb || !bookingPaid) return false;
    } else if (!input.hasSp3k || !bookingPaid) {
      return false;
    }
  } else if (tahap === "AJB") {
    if (isBatal) return false;
    if (!hasAjb || !input.ppjbSudahDibayar) return false;
  }

  return calcAgentPencairanAmounts({ ...input, tahap }).eligible;
}

export function getPencairanTahapLabel(
  tahap: AgentPencairanTahap,
  context: {
    penjualanStatus?: string | null;
    caraPembayaran?: string | null;
  },
): string {
  const isBatal = isPenjualanBatal(context.penjualanStatus);
  const isCash = isCashPayment(context.caraPembayaran);

  if (tahap === "PPJB") {
    if (isBatal) return "Closing Fee (Transaksi Batal)";
    if (isCash) return "PPJB (Closing 100% + Komisi 50%)";
    return "SP3K (Closing Fee)";
  }
  if (isCash) return "AJB (Sisa Komisi 50%)";
  return "AJB (Komisi Marketing)";
}
