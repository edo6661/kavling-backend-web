import { effectiveTagihanTujuan } from "../tagihan/tagihanTujuan.js";

export type AgentPencairanTahap = "PPJB" | "AJB";
export type AgentPencairanStatus = "MENUNGGU_PEMBAYARAN" | "SUDAH_DIBAYAR";
export type PencairanKomponen = "closing" | "marketing";

/** Komisi cash: 50% di tahap PPJB, 50% di tahap AJB */
export const KOMISI_CASH_PPJB_RATIO = 0.5;

export interface ProgressPenjualanRef {
  filePpjb?: string | null;
  fileAjb?: string | null;
  fileSp3k?: string | null;
  fileSuratPernyataanAkadKredit?: string | null;
}

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
  hasAjb: boolean;
  hasAkadKredit: boolean;
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
  /** Gabung ke pengajuan PPJB yang masih menunggu (mis. closing dulu, komisi belakangan) */
  mergeIntoExistingId?: number;
}

export interface PencairanExistingRecord {
  id: number;
  tahap: AgentPencairanTahap;
  status: AgentPencairanStatus;
  closingNominal: number;
  marketingNominal: number;
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
  progress: ProgressPenjualanRef | null | undefined,
): boolean {
  return !!progress?.filePpjb;
}

export function hasSp3kComplete(
  progress: ProgressPenjualanRef | null | undefined,
): boolean {
  return !!progress?.fileSp3k;
}

export function hasAjbComplete(
  progress: ProgressPenjualanRef | null | undefined,
): boolean {
  return !!progress?.fileAjb;
}

/** Akad kredit: bukti PPJB atau AJB (atau surat pernyataan akad kredit) */
export function hasAkadKreditComplete(
  progress: ProgressPenjualanRef | null | undefined,
): boolean {
  return !!(
    progress?.filePpjb ||
    progress?.fileAjb ||
    progress?.fileSuratPernyataanAkadKredit
  );
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

/** Komisi marketing penuh (basis nilai AJB jika ada, else harga jual) */
export function getFullMarketingFee(ctx: AgentPencairanCalcContext): number {
  if (isPenjualanBatal(ctx.penjualanStatus)) return 0;
  const nilaiAjb = Number(ctx.nilaiAjb) || 0;
  const hargaJual = Number(ctx.hargaJual) || 0;
  const pct = Number(ctx.agent.feeMarketingPct) || 0;
  const base = getMarketingBase(nilaiAjb, hargaJual);
  return calcFullMarketingFee(base, pct);
}

export function getTotalFeeReferensi(ctx: AgentPencairanCalcContext): number {
  const bookingPaid = isBookingFeePaid(ctx.tagihanList);
  const isBatal = isPenjualanBatal(ctx.penjualanStatus);

  const closingFull = getClosingFeeAmount(
    bookingPaid,
    ctx.feeAgent?.closingNominal,
    ctx.agent.feeClosingNominal,
  );

  if (isBatal) return closingFull;
  return closingFull + getFullMarketingFee(ctx);
}

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

interface CashMarketingBuckets {
  ppjbCap: number;
  ajbCap: number;
  ppjbSisa: number;
  ajbSisa: number;
}

function getCashMarketingBuckets(
  ctx: AgentPencairanCalcContext,
  sudah: PencairanSudahDiajukan,
): CashMarketingBuckets {
  const full = getFullMarketingFee(ctx);
  const ppjbCap = full * KOMISI_CASH_PPJB_RATIO;
  const ajbCap = full - ppjbCap;
  const sudahMarketing = sudah.marketingNominal;

  const ppjbSudahDibayar = Math.min(sudahMarketing, ppjbCap);
  const ajbSudahDibayar = Math.max(0, sudahMarketing - ppjbCap);

  return {
    ppjbCap,
    ajbCap,
    ppjbSisa: Math.max(0, ppjbCap - ppjbSudahDibayar),
    ajbSisa: Math.max(0, ajbCap - ajbSudahDibayar),
  };
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

  if (nominalSisa <= 0) {
    return {
      key: "closing",
      nominalPenuh: closingFull,
      nominalSisa: 0,
      eligible: false,
      alasan: "",
    };
  }

  let eligible = false;
  let alasan = "Belum memenuhi syarat closing fee";

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
    alasan = "Upload dokumen PPJB di menu Progress Penjualan";
  } else {
    alasan = "Upload dokumen SP3K di menu Progress Penjualan";
  }

  return { key: "closing", nominalPenuh: closingFull, nominalSisa, eligible, alasan };
}

function getMarketingEligibility(
  ctx: AgentPencairanCalcContext,
  sudah: PencairanSudahDiajukan,
): PencairanKomponenInfo {
  const isCash = isCashPayment(ctx.caraPembayaran);
  const isBatal = isPenjualanBatal(ctx.penjualanStatus);
  const nilaiAjb = Number(ctx.nilaiAjb) || 0;
  const bookingPaid = isBookingFeePaid(ctx.tagihanList);
  const fullMarketing = getFullMarketingFee(ctx);

  if (isBatal) {
    return {
      key: "marketing",
      nominalPenuh: 0,
      nominalSisa: 0,
      eligible: false,
      alasan: "Transaksi batal — komisi marketing tidak dicairkan",
    };
  }

  if (fullMarketing <= 0) {
    return {
      key: "marketing",
      nominalPenuh: 0,
      nominalSisa: 0,
      eligible: false,
      alasan: "Komisi marketing belum tersedia",
    };
  }

  if (!bookingPaid) {
    return {
      key: "marketing",
      nominalPenuh: fullMarketing,
      nominalSisa: 0,
      eligible: false,
      alasan: "Booking fee belum lunas",
    };
  }

  if (isCash) {
    const buckets = getCashMarketingBuckets(ctx, sudah);
    const nominalSisa = buckets.ppjbSisa + buckets.ajbSisa;

    if (nominalSisa <= 0) {
      return {
        key: "marketing",
        nominalPenuh: fullMarketing,
        nominalSisa: 0,
        eligible: false,
        alasan: "Komisi marketing sudah diajukan semua",
      };
    }

    const ppjbEligible = buckets.ppjbSisa > 0 && ctx.hasPpjb;
    const ajbEligible =
      buckets.ajbSisa > 0 && ctx.hasPpjb && ctx.hasAjb && nilaiAjb > 0;

    if (ppjbEligible || ajbEligible) {
      const parts: string[] = [];
      if (ppjbEligible) parts.push(`50% PPJB (${buckets.ppjbSisa.toLocaleString("id-ID")})`);
      if (ajbEligible) parts.push(`50% AJB (${buckets.ajbSisa.toLocaleString("id-ID")})`);
      return {
        key: "marketing",
        nominalPenuh: fullMarketing,
        nominalSisa,
        eligible: true,
        alasan: `Komisi tersedia: ${parts.join(" + ")}`,
      };
    }

    if (buckets.ppjbSisa > 0 && !ctx.hasPpjb) {
      return {
        key: "marketing",
        nominalPenuh: fullMarketing,
        nominalSisa: buckets.ppjbSisa,
        eligible: false,
        alasan: "Upload dokumen PPJB di menu Progress Penjualan (tahap 50%)",
      };
    }

    if (buckets.ajbSisa > 0) {
      return {
        key: "marketing",
        nominalPenuh: fullMarketing,
        nominalSisa: buckets.ajbSisa,
        eligible: false,
        alasan: ctx.hasAjb
          ? "Nilai AJB belum diisi"
          : "Upload dokumen AJB di menu Progress Penjualan (sisa 50%)",
      };
    }

    return {
      key: "marketing",
      nominalPenuh: fullMarketing,
      nominalSisa: 0,
      eligible: false,
      alasan: "Belum memenuhi syarat komisi marketing",
    };
  }

  // KPR
  const nominalSisa = Math.max(0, fullMarketing - sudah.marketingNominal);

  if (nominalSisa <= 0) {
    return {
      key: "marketing",
      nominalPenuh: fullMarketing,
      nominalSisa: 0,
      eligible: false,
      alasan: "Komisi marketing sudah diajukan semua",
    };
  }

  if (!ctx.hasSp3k) {
    return {
      key: "marketing",
      nominalPenuh: fullMarketing,
      nominalSisa,
      eligible: false,
      alasan: "Upload dokumen SP3K di menu Progress Penjualan",
    };
  }

  if (!ctx.hasAkadKredit) {
    return {
      key: "marketing",
      nominalPenuh: fullMarketing,
      nominalSisa,
      eligible: false,
      alasan:
        "Upload dokumen PPJB atau AJB (akad kredit) di menu Progress Penjualan",
    };
  }

  if (nilaiAjb <= 0) {
    return {
      key: "marketing",
      nominalPenuh: fullMarketing,
      nominalSisa,
      eligible: false,
      alasan: "Isi nilai AJB di menu Progress Penjualan",
    };
  }

  return {
    key: "marketing",
    nominalPenuh: fullMarketing,
    nominalSisa,
    eligible: true,
    alasan: "SP3K & akad kredit sudah ada — komisi dari nilai AJB",
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
  const potonganPphPct = Number(ctx.agent.potonganPph) || 0;
  const totalFeeReferensi = getTotalFeeReferensi(ctx);

  return {
    komponen: [
      getClosingEligibility(ctx, closingFull, sudah),
      getMarketingEligibility(ctx, sudah),
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

function calcMarketingSubmitAmount(
  ctx: AgentPencairanCalcContext,
  sudah: PencairanSudahDiajukan,
): { amount: number; ppjbPortion: number; ajbPortion: number } {
  const info = getMarketingEligibility(ctx, sudah);
  if (!info.eligible) return { amount: 0, ppjbPortion: 0, ajbPortion: 0 };

  if (isCashPayment(ctx.caraPembayaran)) {
    const buckets = getCashMarketingBuckets(ctx, sudah);
    const ppjbPortion = buckets.ppjbSisa > 0 && ctx.hasPpjb ? buckets.ppjbSisa : 0;
    const ajbPortion =
      buckets.ajbSisa > 0 && ctx.hasAjb && Number(ctx.nilaiAjb) > 0
        ? buckets.ajbSisa
        : 0;
    return {
      amount: ppjbPortion + ajbPortion,
      ppjbPortion,
      ajbPortion,
    };
  }

  return {
    amount: info.nominalSisa,
    ppjbPortion: 0,
    ajbPortion: info.nominalSisa,
  };
}

function findPpjbRecord(
  existingRecords: PencairanExistingRecord[],
): PencairanExistingRecord | undefined {
  return existingRecords.find((r) => r.tahap === "PPJB");
}

function findAjbRecord(
  existingRecords: PencairanExistingRecord[],
): PencairanExistingRecord | undefined {
  return existingRecords.find((r) => r.tahap === "AJB");
}

/** PPJB masih menunggu bayar — komponen lain bisa digabung ke baris yang sama */
function canMergeIntoPendingPpjb(
  ppjb: PencairanExistingRecord | undefined,
): boolean {
  return !!ppjb && ppjb.status === "MENUNGGU_PEMBAYARAN";
}

/** Closing PPJB sudah dibayar; sisa komisi 50% PPJB masuk slot AJB */
function shouldUseAjbForRemainingPpjbMarketing(
  ppjb: PencairanExistingRecord | undefined,
  ajb: PencairanExistingRecord | undefined,
  ppjbPortion: number,
): boolean {
  return (
    ppjbPortion > 0 &&
    !!ppjb &&
    ppjb.status === "SUDAH_DIBAYAR" &&
    Number(ppjb.marketingNominal) === 0 &&
    !ajb
  );
}

export function resolvePencairanTahap(
  includeClosing: boolean,
  includeMarketing: boolean,
  sudah: PencairanSudahDiajukan,
  marketingBreakdown: { ppjbPortion: number; ajbPortion: number },
  existingRecords: PencairanExistingRecord[] = [],
): AgentPencairanTahap {
  const ppjb = findPpjbRecord(existingRecords);
  const ajb = findAjbRecord(existingRecords);

  if (includeMarketing) {
    if (ajb) {
      throw new Error("AJB_ALREADY_SUBMITTED");
    }
    if (marketingBreakdown.ajbPortion > 0) {
      return "AJB";
    }
    if (marketingBreakdown.ppjbPortion > 0) {
      if (canMergeIntoPendingPpjb(ppjb)) {
        return "PPJB";
      }
      if (shouldUseAjbForRemainingPpjbMarketing(ppjb, ajb, marketingBreakdown.ppjbPortion)) {
        return "AJB";
      }
      if (sudah.tahaps.includes("PPJB")) {
        throw new Error("PPJB_ALREADY_SUBMITTED");
      }
      return "PPJB";
    }
  }

  if (canMergeIntoPendingPpjb(ppjb) && Number(ppjb!.closingNominal) === 0) {
    return "PPJB";
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
  existingRecords: PencairanExistingRecord[] = [],
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
  let ppjbPortion = 0;
  let ajbPortion = 0;

  if (includeClosing) {
    if (!closingInfo.eligible || closingInfo.nominalSisa <= 0) {
      throw new Error("CLOSING_NOT_ELIGIBLE");
    }
    closingNominal = closingInfo.nominalSisa;
  }

  if (includeMarketing) {
    if (!marketingInfo.eligible) {
      throw new Error("MARKETING_NOT_ELIGIBLE");
    }
    const m = calcMarketingSubmitAmount(ctx, sudah);
    if (m.amount <= 0) {
      throw new Error("MARKETING_NOT_ELIGIBLE");
    }
    marketingNominal = m.amount;
    ppjbPortion = m.ppjbPortion;
    ajbPortion = m.ajbPortion;
  }

  const potonganPph = preview.potonganPph;

  const tahap = resolvePencairanTahap(
    includeClosing,
    includeMarketing,
    sudah,
    { ppjbPortion, ajbPortion },
    existingRecords,
  );

  const ppjb = findPpjbRecord(existingRecords);
  let mergeIntoExistingId: number | undefined;
  let finalClosing = closingNominal;
  let finalMarketing = marketingNominal;

  if (canMergeIntoPendingPpjb(ppjb) && tahap === "PPJB" && ppjb) {
    mergeIntoExistingId = ppjb.id;
    finalClosing = Number(ppjb.closingNominal) + closingNominal;
    finalMarketing = Number(ppjb.marketingNominal) + marketingNominal;
  }

  const finalGross = finalClosing + finalMarketing;
  const finalTotal = finalGross - potonganPph;

  if (finalTotal <= 0) {
    throw new Error("TOTAL_NOT_POSITIVE");
  }

  const result: PencairanSubmitResult = {
    tahap,
    closingNominal: finalClosing,
    marketingNominal: finalMarketing,
    potonganPph,
    totalNominal: finalTotal,
    totalFeeReferensi: preview.totalFeeReferensi,
  };

  if (mergeIntoExistingId !== undefined) {
    result.mergeIntoExistingId = mergeIntoExistingId;
  }

  return result;
}
