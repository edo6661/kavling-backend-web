import { effectiveTagihanTujuan } from "../tagihan/tagihanTujuan.js";

export type AgentPencairanTahap = "PPJB" | "AJB";
export type PencairanKomponen = "closing" | "marketing";

/** Komisi cash saat nilai AJB belum ada (hanya 50% di PPJB) */
export const KOMISI_CASH_PPJB_RATIO = 0.5;

export interface AgentPencairanCalcContext {
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
  hasPpjb: boolean;
  hasSp3k: boolean;
}

export interface PencairanSudahDiajukan {
  closingNominal: number;
  marketingNominal: number;
  tahaps: AgentPencairanTahap[];
}

export interface PencairanKomponenInfo {
  key: PencairanKomponen;
  nominalPenuh: number;
  nominalSisa: number;
  eligible: boolean;
  alasan?: string;
}

export interface PencairanPreviewResult {
  komponen: PencairanKomponenInfo[];
  totalFeeReferensi: number;
  potonganPph: number;
  potonganPphPct: number;
}

export interface PencairanSubmitResult {
  tahap: AgentPencairanTahap;
  closingNominal: number;
  marketingNominal: number;
  potonganPph: number;
  totalNominal: number;
  totalFeeReferensi: number;
}

export function isCashPayment(
  caraPembayaran: string | null | undefined,
): boolean {
  const key = (caraPembayaran ?? "").replace(/\s/g, "_").toUpperCase();
  return key === "CASH_KERAS" || key === "CASH_BERTAHAP";
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
  tagihanList: AgentPencairanCalcContext["tagihanList"],
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

/** Total fee (+ closing) referensi tabel — basis perhitungan PPh */
export function getTotalFeeReferensi(ctx: AgentPencairanCalcContext): number {
  const bookingPaid = isBookingFeePaid(ctx.tagihanList);
  const nilaiAjb = Number(ctx.nilaiAjb) || 0;
  const hargaJual = Number(ctx.hargaJual) || 0;
  const feeMarketingPct = Number(ctx.agent.feeMarketingPct) || 0;
  const isBatal = isPenjualanBatal(ctx.penjualanStatus);

  if (isBatal) {
    return getClosingFeeAmount(
      bookingPaid,
      ctx.feeAgent?.closingNominal,
      ctx.agent.feeClosingNominal,
    );
  }

  const closingFull = getClosingFeeAmount(
    bookingPaid,
    ctx.feeAgent?.closingNominal,
    ctx.agent.feeClosingNominal,
  );
  const base = getMarketingBase(nilaiAjb, hargaJual);
  const fullMarketing = calcFullMarketingFee(base, feeMarketingPct);

  return closingFull + fullMarketing;
}

/** Pot. PPh = total fee (+ closing) × % PPh */
export function calcPotonganPph(
  totalFeeReferensi: number,
  potonganPphPct: number,
): number {
  return totalFeeReferensi * (potonganPphPct / 100);
}

export function sumSudahDiajukan(
  records: Array<{ closingNominal: number; marketingNominal: number; tahap: AgentPencairanTahap }>,
): PencairanSudahDiajukan {
  return {
    closingNominal: records.reduce((s, r) => s + Number(r.closingNominal), 0),
    marketingNominal: records.reduce((s, r) => s + Number(r.marketingNominal), 0),
    tahaps: records.map((r) => r.tahap),
  };
}

/** Batas komisi marketing yang berhak (bukan sisa — total entitlement) */
export function getMarketingEntitlement(
  ctx: AgentPencairanCalcContext,
): number {
  if (isPenjualanBatal(ctx.penjualanStatus)) return 0;

  const isCash = isCashPayment(ctx.caraPembayaran);
  const nilaiAjb = Number(ctx.nilaiAjb) || 0;
  const hargaJual = Number(ctx.hargaJual) || 0;
  const feeMarketingPct = Number(ctx.agent.feeMarketingPct) || 0;
  const bookingPaid = isBookingFeePaid(ctx.tagihanList);

  if (!bookingPaid) return 0;

  if (nilaiAjb > 0) {
    return calcFullMarketingFee(nilaiAjb, feeMarketingPct);
  }

  if (isCash && ctx.hasPpjb) {
    return (
      calcFullMarketingFee(hargaJual, feeMarketingPct) * KOMISI_CASH_PPJB_RATIO
    );
  }

  return 0;
}

function getClosingEligibility(
  ctx: AgentPencairanCalcContext,
  closingFull: number,
  sudah: PencairanSudahDiajukan,
): PencairanKomponenInfo {
  const isCash = isCashPayment(ctx.caraPembayaran);
  const isBatal = isPenjualanBatal(ctx.penjualanStatus);
  const bookingPaid = isBookingFeePaid(ctx.tagihanList);
  const nominalSisa = Math.max(0, closingFull - sudah.closingNominal);

  let eligible = false;
  let alasan = "Closing fee sudah diajukan semua";

  if (nominalSisa <= 0) {
    return { key: "closing", nominalPenuh: closingFull, nominalSisa: 0, eligible: false, alasan };
  }

  if (!bookingPaid) {
    alasan = "Booking fee belum lunas";
  } else if (isBatal) {
    eligible = true;
    alasan = "Transaksi batal — closing fee dapat dicairkan";
  } else if (isCash && ctx.hasPpjb) {
    eligible = true;
    alasan = "Dokumen PPJB sudah diunggah & booking lunas";
  } else if (!isCash && ctx.hasSp3k) {
    eligible = true;
    alasan = "Dokumen SP3K sudah diunggah & booking lunas";
  } else if (isCash) {
    alasan = "Upload dokumen PPJB di Progress Penjualan";
  } else {
    alasan = "Upload dokumen SP3K di Progress Penjualan";
  }

  return { key: "closing", nominalPenuh: closingFull, nominalSisa, eligible, alasan };
}

function getMarketingEligibility(
  ctx: AgentPencairanCalcContext,
  entitlement: number,
  sudah: PencairanSudahDiajukan,
): PencairanKomponenInfo {
  const isCash = isCashPayment(ctx.caraPembayaran);
  const isBatal = isPenjualanBatal(ctx.penjualanStatus);
  const nilaiAjb = Number(ctx.nilaiAjb) || 0;
  const bookingPaid = isBookingFeePaid(ctx.tagihanList);
  const nominalSisa = Math.max(0, entitlement - sudah.marketingNominal);

  if (isBatal || entitlement <= 0) {
    return {
      key: "marketing",
      nominalPenuh: entitlement,
      nominalSisa: 0,
      eligible: false,
      alasan: isBatal
        ? "Transaksi batal — komisi marketing tidak dicairkan"
        : "Komisi marketing belum tersedia",
    };
  }

  if (nominalSisa <= 0) {
    return {
      key: "marketing",
      nominalPenuh: entitlement,
      nominalSisa: 0,
      eligible: false,
      alasan: "Komisi marketing sudah diajukan semua",
    };
  }

  let eligible = false;
  let alasan = "Belum memenuhi syarat komisi marketing";

  if (!bookingPaid) {
    alasan = "Booking fee belum lunas";
  } else if (nilaiAjb > 0) {
    if (isCash && ctx.hasPpjb) {
      eligible = true;
      alasan = "Nilai AJB & PPJB sudah ada — komisi penuh dapat dicairkan";
    } else if (!isCash && ctx.hasSp3k) {
      eligible = true;
      alasan = "Nilai AJB & SP3K sudah ada — komisi dapat dicairkan";
    } else if (isCash) {
      alasan = "Upload dokumen PPJB di Progress Penjualan";
    } else {
      alasan = "Upload dokumen SP3K di Progress Penjualan";
    }
  } else if (isCash && ctx.hasPpjb) {
    eligible = true;
    alasan = `Komisi 50% (nilai AJB belum ada) — sisa 50% setelah nilai AJB diisi`;
  }

  return {
    key: "marketing",
    nominalPenuh: entitlement,
    nominalSisa,
    eligible,
    alasan,
  };
}

export function getPencairanPreview(
  ctx: AgentPencairanCalcContext,
  sudah: PencairanSudahDiajukan,
): PencairanPreviewResult {
  const bookingPaid = isBookingFeePaid(ctx.tagihanList);
  const closingFull = getClosingFeeAmount(
    bookingPaid,
    ctx.feeAgent?.closingNominal,
    ctx.agent.feeClosingNominal,
  );
  const entitlement = getMarketingEntitlement(ctx);
  const potonganPphPct = Number(ctx.agent.potonganPph) || 0;
  const totalFeeReferensi = getTotalFeeReferensi(ctx);

  return {
    komponen: [
      getClosingEligibility(ctx, closingFull, sudah),
      getMarketingEligibility(ctx, entitlement, sudah),
    ],
    totalFeeReferensi,
    potonganPph: calcPotonganPph(totalFeeReferensi, potonganPphPct),
    potonganPphPct,
  };
}

export function hasAnyEligiblePencairan(
  ctx: AgentPencairanCalcContext,
  sudah: PencairanSudahDiajukan,
): boolean {
  return getPencairanPreview(ctx, sudah).komponen.some(
    (k) => k.eligible && k.nominalSisa > 0,
  );
}

export function resolvePencairanTahap(
  includeClosing: boolean,
  includeMarketing: boolean,
  sudah: PencairanSudahDiajukan,
): AgentPencairanTahap {
  if (includeMarketing) {
    if (sudah.tahaps.includes("AJB")) {
      throw new Error("AJB_ALREADY_SUBMITTED");
    }
    return "AJB";
  }
  if (sudah.tahaps.includes("PPJB")) {
    throw new Error("PPJB_ALREADY_SUBMITTED");
  }
  return "PPJB";
}

export function calcPencairanSubmit(
  ctx: AgentPencairanCalcContext,
  sudah: PencairanSudahDiajukan,
  selected: PencairanKomponen[],
): PencairanSubmitResult {
  const preview = getPencairanPreview(ctx, sudah);
  const closingInfo = preview.komponen.find((k) => k.key === "closing")!;
  const marketingInfo = preview.komponen.find((k) => k.key === "marketing")!;

  const includeClosing = selected.includes("closing");
  const includeMarketing = selected.includes("marketing");

  if (!includeClosing && !includeMarketing) {
    throw new Error("NO_KOMPONEN_SELECTED");
  }

  let closingNominal = 0;
  let marketingNominal = 0;

  if (includeClosing) {
    if (!closingInfo.eligible || closingInfo.nominalSisa <= 0) {
      throw new Error("CLOSING_NOT_ELIGIBLE");
    }
    closingNominal = closingInfo.nominalSisa;
  }

  if (includeMarketing) {
    if (!marketingInfo.eligible || marketingInfo.nominalSisa <= 0) {
      throw new Error("MARKETING_NOT_ELIGIBLE");
    }
    marketingNominal = marketingInfo.nominalSisa;
  }

  const selectedGross = closingNominal + marketingNominal;
  const potonganPph = preview.potonganPph;
  const totalNominal = selectedGross - potonganPph;

  if (totalNominal <= 0) {
    throw new Error("TOTAL_NOT_POSITIVE");
  }

  const tahap = resolvePencairanTahap(
    includeClosing,
    includeMarketing,
    sudah,
  );

  return {
    tahap,
    closingNominal,
    marketingNominal,
    potonganPph,
    totalNominal,
    totalFeeReferensi: preview.totalFeeReferensi,
  };
}

export function getPencairanTahapLabel(
  tahap: AgentPencairanTahap,
  context: {
    penjualanStatus?: string | null;
    caraPembayaran?: string | null;
    hasMarketing: boolean;
    hasClosing: boolean;
  },
): string {
  const isBatal = isPenjualanBatal(context.penjualanStatus);
  const isCash = isCashPayment(context.caraPembayaran);

  if (context.hasClosing && context.hasMarketing) {
    return isCash ? "PPJB + AJB (Closing & Komisi)" : "SP3K + AJB (Closing & Komisi)";
  }
  if (context.hasClosing) {
    if (isBatal) return "Closing Fee (Transaksi Batal)";
    if (isCash) return "PPJB (Closing Fee)";
    return "SP3K (Closing Fee)";
  }
  if (isCash) return "AJB (Komisi Marketing)";
  return "AJB (Komisi Marketing)";
}
