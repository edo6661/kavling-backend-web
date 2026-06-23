import { effectiveTagihanTujuan } from "../tagihan/tagihanTujuan.js";
import { extractClosingDpp } from "./agentPkpTax.js";
import {
  isAllProgressFileAjbComplete,
  isAllProgressFilePpjbComplete,
  sumNilaiAjb,
  type ProgressSertifikatTambahanSlot,
} from "../progressPenjualan/progressPenjualanSertifikatUtils.js";

export type AgentPencairanTahap = "PPJB" | "AJB";
export type AgentPencairanStatus = "MENUNGGU_PEMBAYARAN" | "SUDAH_DIBAYAR";
export type PencairanKomponen = "closing" | "marketing";

/** Komisi cash: 50% di tahap PPJB, 50% di tahap AJB */
export const KOMISI_CASH_PPJB_RATIO = 0.5;

export interface ProgressPenjualanRef {
  nilaiAjb?: number | null;
  filePpjb?: string | null;
  fileAjb?: string | null;
  fileSp3k?: string | null;
  fileSuratPernyataanAkadKredit?: string | null;
  sertifikatTambahan?: ProgressSertifikatTambahanSlot[];
  totals?: { nilaiAjb: number };
}

export function resolveNilaiAjbTotal(
  progress: ProgressPenjualanRef | null | undefined,
): number {
  if (!progress) return 0;
  if (progress.totals?.nilaiAjb != null) {
    return Number(progress.totals.nilaiAjb);
  }
  const utama = {
    nilaiAjb: progress.nilaiAjb ? Number(progress.nilaiAjb) : null,
  };
  const tambahan =
    progress.sertifikatTambahan?.map((row) => ({
      urutan: row.urutan,
      nilaiAjb: row.nilaiAjb ? Number(row.nilaiAjb) : null,
    })) ?? [];
  return sumNilaiAjb(utama, tambahan);
}

function mapProgressSlots(progress: ProgressPenjualanRef | null | undefined) {
  const utama = progress
    ? {
        nilaiAjb: progress.nilaiAjb ? Number(progress.nilaiAjb) : null,
        filePpjb: progress.filePpjb,
        fileAjb: progress.fileAjb,
      }
    : null;
  const tambahan =
    progress?.sertifikatTambahan?.map((row) => ({
      urutan: row.urutan,
      nilaiAjb: row.nilaiAjb ? Number(row.nilaiAjb) : null,
      filePpjb: row.filePpjb,
      fileAjb: row.fileAjb,
    })) ?? [];
  return { utama, tambahan };
}

export interface AgentPencairanCalcContext {
  penjualanStatus?: string | null;
  bookingFeeLunasBatal?: boolean;
  caraPembayaran: string | null;
  hargaJual: number;
  agent: {
    feeMarketingPct: number | null;
    feeClosingNominal: number | null;
    potonganPph: number | null;
    isPkp?: boolean;
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
  potonganPph: number;
}

export function sumPotonganPphSudahDiajukan(
  records: Array<{ potonganPph: number }>,
): number {
  return records.reduce((s, r) => s + Number(r.potonganPph), 0);
}

/** PPh total sekali per penjualan; pengajuan berikutnya tidak memotong lagi */
export function calcPotonganPphSisa(
  pphTotalPenuh: number,
  existingRecords: Array<{ potonganPph: number }>,
): number {
  const sudah = sumPotonganPphSudahDiajukan(existingRecords);
  return Math.max(0, pphTotalPenuh - sudah);
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
  jumlahSertifikatTanah = 1,
): boolean {
  const { utama, tambahan } = mapProgressSlots(progress);
  return isAllProgressFilePpjbComplete(jumlahSertifikatTanah, utama, tambahan);
}

export function hasSp3kComplete(
  progress: ProgressPenjualanRef | null | undefined,
): boolean {
  return !!progress?.fileSp3k;
}

export function hasAjbComplete(
  progress: ProgressPenjualanRef | null | undefined,
  jumlahSertifikatTanah = 1,
): boolean {
  const { utama, tambahan } = mapProgressSlots(progress);
  return isAllProgressFileAjbComplete(jumlahSertifikatTanah, utama, tambahan);
}

/** Akad kredit: surat kesiapan, atau semua tanah sudah PPJB / AJB */
export function hasAkadKreditComplete(
  progress: ProgressPenjualanRef | null | undefined,
  jumlahSertifikatTanah = 1,
): boolean {
  if (progress?.fileSuratPernyataanAkadKredit) return true;
  return (
    hasPpjbComplete(progress, jumlahSertifikatTanah) ||
    hasAjbComplete(progress, jumlahSertifikatTanah)
  );
}

export function isBookingFeePaid(
  tagihanList: AgentPencairanCalcContext["tagihanList"],
  bookingFeeLunasBatal = false,
): boolean {
  if (bookingFeeLunasBatal) return true;
  return tagihanList.some(
    (t) =>
      effectiveTagihanTujuan(t as Parameters<typeof effectiveTagihanTujuan>[0]) ===
        "BOOKING_FEE" && t.status === "LUNAS",
  );
}

/** Basis komisi marketing — cash & KPR dari nilai AJB */
export function getMarketingBase(nilaiAjb: number): number {
  return nilaiAjb > 0 ? nilaiAjb : 0;
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
  isPkp = false,
): number {
  if (!bookingPaid) return 0;
  const gross = Number(feeAgentClosing) || Number(agentClosing) || 0;
  return extractClosingDpp(gross, isPkp);
}

/** Komisi marketing penuh — dari nilai AJB (cash & KPR) */
export function getFullMarketingFee(ctx: AgentPencairanCalcContext): number {
  if (isPenjualanBatal(ctx.penjualanStatus)) return 0;
  const nilaiAjb = Number(ctx.nilaiAjb) || 0;
  const pct = Number(ctx.agent.feeMarketingPct) || 0;
  return calcFullMarketingFee(getMarketingBase(nilaiAjb), pct);
}

export function getTotalFeeReferensi(ctx: AgentPencairanCalcContext): number {
  const bookingPaid = isBookingFeePaid(
    ctx.tagihanList,
    ctx.bookingFeeLunasBatal,
  );
  const isBatal = isPenjualanBatal(ctx.penjualanStatus);

  const closingFull = getClosingFeeAmount(
    bookingPaid,
    ctx.feeAgent?.closingNominal,
    ctx.agent.feeClosingNominal,
    ctx.agent.isPkp,
  );

  if (isBatal) return closingFull;
  return closingFull + getFullMarketingFee(ctx);
}

export function calcPotonganPph(
  totalFeeReferensi: number,
  potonganPphPct: number,
): number {
  /** total fee = closing + marketing; pot. PPh = total fee × % */
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
  const bookingPaid = isBookingFeePaid(
    ctx.tagihanList,
    ctx.bookingFeeLunasBatal,
  );
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
    alasan = "Belum PPJB";
  } else {
    alasan = "Belum SP3K";
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
  const bookingPaid = isBookingFeePaid(
    ctx.tagihanList,
    ctx.bookingFeeLunasBatal,
  );
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
    let alasan = "Komisi marketing belum tersedia";
    if (bookingPaid) {
      if (isCash && nilaiAjb <= 0) {
        alasan = "Isi nilai AJB di menu Progress Penjualan";
      } else if (!isCash) {
        if (!ctx.hasSp3k) {
          alasan = "Upload dokumen SP3K di menu Progress Penjualan";
        } else if (!ctx.hasAkadKredit) {
          alasan =
            "Upload Dokumen PPJB atau AJB";
        } else if (nilaiAjb <= 0) {
          alasan = "Isi nilai AJB di menu Progress Penjualan";
        }
      }
    }
    return {
      key: "marketing",
      nominalPenuh: 0,
      nominalSisa: 0,
      eligible: false,
      alasan,
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

    const ppjbEligible =
      buckets.ppjbSisa > 0 && ctx.hasPpjb && nilaiAjb > 0;
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
        alasan: "Belum PPJB (tahap 50%)",
      };
    }

    if (buckets.ppjbSisa > 0 && ctx.hasPpjb && nilaiAjb <= 0) {
      return {
        key: "marketing",
        nominalPenuh: fullMarketing,
        nominalSisa: buckets.ppjbSisa,
        eligible: false,
        alasan: "Isi nilai AJB di menu Progress Penjualan",
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
          : "Belum AJB (sisa 50%)",
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
      alasan: "Belum SP3K",
    };
  }

  if (!ctx.hasAkadKredit) {
    return {
      key: "marketing",
      nominalPenuh: fullMarketing,
      nominalSisa,
      eligible: false,
      alasan:
        "Upload Dokumen PPJB atau AJB",
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
  const bookingPaid = isBookingFeePaid(
    ctx.tagihanList,
    ctx.bookingFeeLunasBatal,
  );
  const closingFull = getClosingFeeAmount(
    bookingPaid,
    ctx.feeAgent?.closingNominal,
    ctx.agent.feeClosingNominal,
    ctx.agent.isPkp,
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
    const ppjbPortion =
      buckets.ppjbSisa > 0 && ctx.hasPpjb && Number(ctx.nilaiAjb) > 0
        ? buckets.ppjbSisa
        : 0;
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

  const pphTotalPenuh = preview.potonganPph;
  const pphSudahAll = sumPotonganPphSudahDiajukan(existingRecords);

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

  const pphForThisSubmit = Math.max(0, pphTotalPenuh - pphSudahAll);
  const potonganPph =
    mergeIntoExistingId && ppjb
      ? Number(ppjb.potonganPph) + pphForThisSubmit
      : pphForThisSubmit;

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
