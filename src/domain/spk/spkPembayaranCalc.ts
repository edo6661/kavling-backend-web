import type {
  SpkKasbonTargetTermin,
  SpkPembayaranJenis,
} from "@prisma/client";
import type { SpkJenis } from "../entities/Spk.js";
import {
  buildAllSpkKasbonTargetLabel,
  buildAllSpkPembayaranJenisLabel,
  buildSpkKasbonTargetLabel,
  buildSpkPembayaranJenisLabel,
  getKasbonTargetSteps,
  getPrerequisiteTerminJenis,
  getSpkTerminScheme,
  getTerminStep,
  isKasbonTargetTermin,
  isTerminJenisForSpk,
  type SpkTerminPembayaranJenis,
  type SpkTerminStepConfig,
} from "./spkTerminScheme.js";

export const SPK_PROGRESS_TERMIN_55 = 55;
export const SPK_PROGRESS_TERMIN_100 = 100;

export const SPK_PEMBAYARAN_JENIS_LABEL = buildAllSpkPembayaranJenisLabel();
export const SPK_KASBON_TARGET_LABEL = buildAllSpkKasbonTargetLabel();

export interface SpkNominalInput {
  nilaiKontrak: number;
}

export interface SpkPembayaranCalcRow {
  id?: number;
  jenis: SpkPembayaranJenis;
  status: "MENUNGGU_PEMBAYARAN" | "SUDAH_DIBAYAR";
  nominal: number;
  mengurangiTermin?: SpkKasbonTargetTermin | null;
  keterangan?: string | null;
}

export interface SpkPengurangTerminRow {
  id?: number;
  jenis: SpkPembayaranJenis;
  nominal: number;
  mengurangiTermin?: SpkKasbonTargetTermin | null;
}

export interface PengurangWaterfallResult {
  byTarget: Partial<Record<SpkKasbonTargetTermin, number>>;
  overflow: number;
}

export type TerminPaymentStatus = Partial<Record<SpkKasbonTargetTermin, boolean>>;

export interface SpkPembayaranKalkulasiBaris {
  label: string;
  nilai: number;
  tipe: "positif" | "negatif" | "hasil";
}

export function isTerminJenis(
  jenis: SpkPembayaranJenis,
  spkJenis: SpkJenis = "RUMAH",
): jenis is SpkTerminPembayaranJenis {
  return isTerminJenisForSpk(jenis, spkJenis);
}

function normalizeMengurangiTermin(
  value: SpkKasbonTargetTermin | null | undefined,
): SpkKasbonTargetTermin | null {
  return isKasbonTargetTermin(value) ? value : null;
}

function buildAllocateOptions(options?: {
  excludeId?: number | undefined;
  additionalNominal?: number | undefined;
  terminStatus?: TerminPaymentStatus | undefined;
  spkJenis?: SpkJenis | undefined;
}) {
  const result: {
    excludeId?: number;
    additionalNominal?: number;
    terminStatus?: TerminPaymentStatus;
    spkJenis?: SpkJenis;
  } = {};
  if (options?.excludeId !== undefined) result.excludeId = options.excludeId;
  if (options?.additionalNominal !== undefined) {
    result.additionalNominal = options.additionalNominal;
  }
  if (options?.terminStatus !== undefined) result.terminStatus = options.terminStatus;
  if (options?.spkJenis !== undefined) result.spkJenis = options.spkJenis;
  return result;
}
function isPengurangJenis(jenis: SpkPembayaranJenis): jenis is "KASBON" | "UPAH" {
  return jenis === "KASBON" || jenis === "UPAH";
}

function toPengurangRow(
  row: {
    id?: number | undefined;
    jenis: SpkPembayaranJenis;
    nominal: number;
    mengurangiTermin?: SpkKasbonTargetTermin | null | undefined;
  },
): SpkPengurangTerminRow {
  const mapped: SpkPengurangTerminRow = {
    jenis: row.jenis,
    nominal: row.nominal,
    mengurangiTermin: normalizeMengurangiTermin(row.mengurangiTermin),
  };
  if (row.id !== undefined) mapped.id = row.id;
  return mapped;
}

function sortPengurangRows(rows: SpkPengurangTerminRow[]): SpkPengurangTerminRow[] {
  return [...rows]
    .filter((p) => isPengurangJenis(p.jenis))
    .sort((a, b) => (a.id ?? Number.MAX_SAFE_INTEGER) - (b.id ?? Number.MAX_SAFE_INTEGER));
}

function getTargetBrutoMap(
  scheme: SpkTerminStepConfig[],
  nilaiKontrak: number,
): Record<SpkKasbonTargetTermin, number> {
  const map = {} as Record<SpkKasbonTargetTermin, number>;
  for (const step of getKasbonTargetSteps(scheme)) {
    map[step.jenis as SpkKasbonTargetTermin] = nilaiKontrak * step.kontrakFraction;
  }
  return map;
}

export function getTerminPaymentStatus(
  pembayaranList: SpkPembayaranCalcRow[],
  spkJenis: SpkJenis = "RUMAH",
): TerminPaymentStatus {
  const scheme = getSpkTerminScheme(spkJenis);
  const status: TerminPaymentStatus = {};
  for (const step of getKasbonTargetSteps(scheme)) {
    const target = step.jenis as SpkKasbonTargetTermin;
    const row = pembayaranList.find((p) => p.jenis === step.jenis);
    status[target] = row?.status === "SUDAH_DIBAYAR";
  }
  return status;
}

export function calcTerminBruto(
  nilaiKontrak: number,
  termin: SpkKasbonTargetTermin,
  spkJenis: SpkJenis = "RUMAH",
): number {
  const step = getTerminStep(getSpkTerminScheme(spkJenis), termin as SpkTerminPembayaranJenis);
  return step ? nilaiKontrak * step.kontrakFraction : 0;
}

export function allocatePengurangWaterfall(
  nilaiKontrak: number,
  rows: SpkPengurangTerminRow[],
  options?: {
    excludeId?: number;
    additionalNominal?: number;
    terminStatus?: TerminPaymentStatus;
    spkJenis?: SpkJenis;
  },
): PengurangWaterfallResult {
  const spkJenis = options?.spkJenis ?? "RUMAH";
  const scheme = getSpkTerminScheme(spkJenis);
  const targets = getKasbonTargetSteps(scheme);
  const brutoByTarget = getTargetBrutoMap(scheme, nilaiKontrak);

  const filled: Partial<Record<SpkKasbonTargetTermin, number>> = {};
  for (const step of targets) {
    const target = step.jenis as SpkKasbonTargetTermin;
    filled[target] = options?.terminStatus?.[target] ? brutoByTarget[target] : 0;
  }

  const consume = (nominal: number) => {
    let remaining = nominal;
    for (const step of targets) {
      const target = step.jenis as SpkKasbonTargetTermin;
      const bruto = brutoByTarget[target];
      const current = filled[target] ?? 0;
      const toFill = Math.min(remaining, Math.max(0, bruto - current));
      filled[target] = current + toFill;
      remaining -= toFill;
    }
    return remaining;
  };

  for (const row of sortPengurangRows(rows)) {
    if (row.id === options?.excludeId) continue;
    consume(row.nominal);
  }

  const overflow = consume(options?.additionalNominal ?? 0);
  return { byTarget: filled, overflow };
}

function toPengurangRowsFromCalc(
  pembayaranList: SpkPembayaranCalcRow[],
): SpkPengurangTerminRow[] {
  return pembayaranList
    .filter((p) => isPengurangJenis(p.jenis))
    .map((p) =>
      toPengurangRow({
        id: p.id,
        jenis: p.jenis,
        nominal: p.nominal,
        mengurangiTermin: p.mengurangiTermin,
      }),
    );
}

export function sumKasbonForTermin(
  nilaiKontrak: number,
  pembayaranList: SpkPembayaranCalcRow[],
  termin: SpkKasbonTargetTermin,
  spkJenis: SpkJenis = "RUMAH",
): number {
  const allocated = allocatePengurangWaterfall(
    nilaiKontrak,
    toPengurangRowsFromCalc(pembayaranList),
    {
      terminStatus: getTerminPaymentStatus(pembayaranList, spkJenis),
      spkJenis,
    },
  );
  return allocated.byTarget[termin] ?? 0;
}

export function sumPengurangForTermin(
  nilaiKontrak: number,
  rows: SpkPengurangTerminRow[],
  termin: SpkKasbonTargetTermin,
  excludeId?: number,
  terminStatus?: TerminPaymentStatus,
  spkJenis: SpkJenis = "RUMAH",
): number {
  const allocated = allocatePengurangWaterfall(
    nilaiKontrak,
    rows,
    buildAllocateOptions({ excludeId, terminStatus, spkJenis }),
  );
  return allocated.byTarget[termin] ?? 0;
}

export interface GetKasbonTargetTerminOptions {
  nilaiKontrak?: number;
  pengurangRows?: SpkPengurangTerminRow[];
  spkJenis?: SpkJenis;
}

export function getKasbonTargetTermin(
  pembayaranList: SpkPembayaranCalcRow[],
  options?: GetKasbonTargetTerminOptions,
): SpkKasbonTargetTermin | null {
  const spkJenis = options?.spkJenis ?? "RUMAH";
  const scheme = getSpkTerminScheme(spkJenis);
  const targets = getKasbonTargetSteps(scheme);
  const terminStatus = getTerminPaymentStatus(pembayaranList, spkJenis);

  for (let i = 0; i < targets.length; i++) {
    const step = targets[i]!;
    const target = step.jenis as SpkKasbonTargetTermin;
    const terminRow = pembayaranList.find((p) => p.jenis === step.jenis);

    if (!terminRow || terminRow.status !== "SUDAH_DIBAYAR") {
      if (
        options?.nilaiKontrak != null &&
        options.nilaiKontrak > 0 &&
        options.pengurangRows
      ) {
        const bruto = calcTerminBruto(options.nilaiKontrak, target, spkJenis);
        const alloc = allocatePengurangWaterfall(
          options.nilaiKontrak,
          options.pengurangRows,
          { terminStatus, spkJenis },
        );
        if ((alloc.byTarget[target] ?? 0) >= bruto) {
          continue;
        }
      }
      return target;
    }
  }

  return null;
}

export interface PengurangRowSplit {
  byTarget: Partial<Record<SpkKasbonTargetTermin, number>>;
}

export function getPengurangRowWaterfallSplit(
  nilaiKontrak: number,
  rows: SpkPengurangTerminRow[],
  rowId: number,
  terminStatus?: TerminPaymentStatus,
  spkJenis: SpkJenis = "RUMAH",
): PengurangRowSplit {
  const without = allocatePengurangWaterfall(
    nilaiKontrak,
    rows,
    buildAllocateOptions({ excludeId: rowId, terminStatus, spkJenis }),
  );
  const withRow = allocatePengurangWaterfall(
    nilaiKontrak,
    rows,
    buildAllocateOptions({ terminStatus, spkJenis }),
  );

  const byTarget: Partial<Record<SpkKasbonTargetTermin, number>> = {};
  const keys = new Set([
    ...Object.keys(without.byTarget),
    ...Object.keys(withRow.byTarget),
  ]) as Set<SpkKasbonTargetTermin>;

  for (const key of keys) {
    const delta = (withRow.byTarget[key] ?? 0) - (without.byTarget[key] ?? 0);
    if (delta > 0) byTarget[key] = delta;
  }

  return { byTarget };
}

export function getPengurangTerminCapacity(
  nilaiKontrak: number,
  rows: SpkPengurangTerminRow[],
  termin: SpkKasbonTargetTermin,
  options?: {
    excludeId?: number;
    additionalNominal?: number;
    terminStatus?: TerminPaymentStatus;
    spkJenis?: SpkJenis;
  },
) {
  const spkJenis = options?.spkJenis ?? "RUMAH";
  const scheme = getSpkTerminScheme(spkJenis);
  const targets = getKasbonTargetSteps(scheme);
  const brutoByTarget = getTargetBrutoMap(scheme, nilaiKontrak);
  const bruto = brutoByTarget[termin];

  const before = allocatePengurangWaterfall(
    nilaiKontrak,
    rows,
    buildAllocateOptions({
      excludeId: options?.excludeId,
      terminStatus: options?.terminStatus,
      spkJenis,
    }),
  );
  const after = allocatePengurangWaterfall(
    nilaiKontrak,
    rows,
    buildAllocateOptions({ ...options, spkJenis }),
  );

  const terpakai = before.byTarget[termin] ?? 0;
  const sisa = Math.max(0, bruto - terpakai);
  const additional = options?.additionalNominal ?? 0;
  const terpakaiSetelah = after.byTarget[termin] ?? 0;
  const sisaSetelah = Math.max(0, bruto - terpakaiSetelah);

  const targetIndex = targets.findIndex((step) => step.jenis === termin);
  const spillTarget =
    targetIndex >= 0 && targetIndex < targets.length - 1
      ? (targets[targetIndex + 1]!.jenis as SpkKasbonTargetTermin)
      : null;
  const spilloverKeTerminBerikutnya = spillTarget
    ? Math.max(0, (after.byTarget[spillTarget] ?? 0) - (before.byTarget[spillTarget] ?? 0))
    : 0;

  let combinedSisa = 0;
  for (let i = Math.max(0, targetIndex); i < targets.length; i++) {
    const target = targets[i]!.jenis as SpkKasbonTargetTermin;
    combinedSisa += Math.max(0, brutoByTarget[target] - (before.byTarget[target] ?? 0));
  }

  return {
    bruto,
    terpakai,
    sisa,
    additional,
    sisaSetelah,
    spilloverKeTermin100: spilloverKeTerminBerikutnya,
    combinedSisa,
    allowed: after.overflow <= 0,
  };
}

export function validatePengurangTerminNominal(
  nilaiKontrak: number,
  rows: SpkPengurangTerminRow[],
  termin: SpkKasbonTargetTermin,
  additionalNominal: number,
  excludeId?: number,
  terminStatus?: TerminPaymentStatus,
  spkJenis: SpkJenis = "RUMAH",
): { allowed: true } | { allowed: false; reason: string } {
  const cap = getPengurangTerminCapacity(nilaiKontrak, rows, termin, {
    ...(excludeId !== undefined ? { excludeId } : {}),
    additionalNominal,
    ...(terminStatus !== undefined ? { terminStatus } : {}),
    spkJenis,
  });

  if (!cap.allowed) {
    const labels = buildSpkKasbonTargetLabel(spkJenis);
    const scheme = getSpkTerminScheme(spkJenis);
    const targets = getKasbonTargetSteps(scheme);
    const isFirstTarget = targets[0]?.jenis === termin;

    return {
      allowed: false,
      reason: isFirstTarget
        ? `Total kasbon & upah melebihi plafon gabungan termin. Sisa tersedia: ${cap.combinedSisa}, nominal diajukan: ${additionalNominal}.`
        : `Total kasbon & upah melebihi plafon ${labels[termin]}. Plafon termin: ${cap.bruto}, sudah terpakai: ${cap.terpakai}, sisa: ${cap.sisa}, nominal diajukan: ${additionalNominal}.`,
    };
  }

  return { allowed: true };
}

export function calcSpkPembayaranNominal(
  jenis: SpkPembayaranJenis,
  spk: SpkNominalInput,
  pembayaranList: SpkPembayaranCalcRow[] = [],
  spkJenis: SpkJenis = "RUMAH",
): number {
  const kontrak = spk.nilaiKontrak;
  const scheme = getSpkTerminScheme(spkJenis);
  const step = getTerminStep(scheme, jenis as SpkTerminPembayaranJenis);
  if (!step) return 0;

  if (step.jenis === "RETENSI") {
    return Math.max(0, kontrak * step.kontrakFraction);
  }

  const kasbon = sumKasbonForTermin(
    kontrak,
    pembayaranList,
    step.jenis as SpkKasbonTargetTermin,
    spkJenis,
  );
  const bruto = kontrak * step.kontrakFraction;
  return Math.max(0, bruto - kasbon);
}

export function buildSpkPembayaranKalkulasi(
  jenis: SpkPembayaranJenis,
  spk: SpkNominalInput,
  pembayaranList: SpkPembayaranCalcRow[] = [],
  spkJenis: SpkJenis = "RUMAH",
): SpkPembayaranKalkulasiBaris[] {
  const kontrak = spk.nilaiKontrak;
  const scheme = getSpkTerminScheme(spkJenis);
  const step = getTerminStep(scheme, jenis as SpkTerminPembayaranJenis);
  const baris: SpkPembayaranKalkulasiBaris[] = [
    { label: "Nilai kontrak SPK", nilai: kontrak, tipe: "positif" },
  ];

  if (!step) return baris;

  const bruto = kontrak * step.kontrakFraction;
  baris.push({
    label: `${Math.round(step.kontrakFraction * 100)}% nilai kontrak (${step.label})`,
    nilai: bruto,
    tipe: "positif",
  });

  if (step.jenis !== "RETENSI") {
    const kasbon = sumKasbonForTermin(
      kontrak,
      pembayaranList,
      step.jenis as SpkKasbonTargetTermin,
      spkJenis,
    );
    if (kasbon > 0) {
      baris.push({
        label: `Total kasbon & upah (mengurangi ${step.kasbonTargetLabel})`,
        nilai: kasbon,
        tipe: "negatif",
      });
    }
    baris.push({
      label: "Nominal diajukan",
      nilai: Math.max(0, bruto - kasbon),
      tipe: "hasil",
    });
  } else {
    baris.push({ label: "Nominal diajukan", nilai: bruto, tipe: "hasil" });
  }

  return baris;
}

export function calcSisaNilaiKontrak(
  nilaiKontrak: number,
  pembayaranList: SpkPembayaranCalcRow[],
): number {
  const paidTotal = pembayaranList
    .filter((p) => p.status === "SUDAH_DIBAYAR")
    .reduce((sum, p) => sum + p.nominal, 0);
  return Math.max(0, nilaiKontrak - paidTotal);
}

export function getMinProgressForJenis(
  jenis: SpkPembayaranJenis,
  spkJenis: SpkJenis = "RUMAH",
): number {
  const step = getTerminStep(
    getSpkTerminScheme(spkJenis),
    jenis as SpkTerminPembayaranJenis,
  );
  return step?.minProgress ?? 100;
}

export function getPrerequisiteJenis(
  jenis: SpkPembayaranJenis,
  spkJenis: SpkJenis = "RUMAH",
): SpkPembayaranJenis | null {
  const prereq = getPrerequisiteTerminJenis(
    getSpkTerminScheme(spkJenis),
    jenis as SpkTerminPembayaranJenis,
  );
  return prereq;
}

export interface SpkPembayaranStatusRow {
  id?: number;
  jenis: SpkPembayaranJenis;
  status: "MENUNGGU_PEMBAYARAN" | "MENUNGGU_PERSETUJUAN" | "SUDAH_DIBAYAR" | "DRAFT";
  nominal?: number;
  mengurangiTermin?: SpkKasbonTargetTermin | null;
}

function normalizeCalcStatus(
  status: SpkPembayaranStatusRow["status"],
): "MENUNGGU_PEMBAYARAN" | "SUDAH_DIBAYAR" {
  if (status === "SUDAH_DIBAYAR") return "SUDAH_DIBAYAR";
  return "MENUNGGU_PEMBAYARAN";
}

export function toSpkPembayaranCalcRows(
  pembayaranList: SpkPembayaranStatusRow[],
): SpkPembayaranCalcRow[] {
  return pembayaranList
    .filter((p) => p.status !== "DRAFT")
    .map((p) => {
      const row: SpkPembayaranCalcRow = {
        jenis: p.jenis,
        status: normalizeCalcStatus(p.status),
        nominal: p.nominal ?? 0,
        mengurangiTermin: normalizeMengurangiTermin(p.mengurangiTermin),
      };
      if (p.id !== undefined) row.id = p.id;
      return row;
    });
}

export type CanRequestKasbonResult =
  | {
      allowed: true;
      targetTermin: SpkKasbonTargetTermin;
      sisaPengurang: number;
      brutoTermin: number;
      terpakai: number;
    }
  | { allowed: false; reason: string };

export function canRequestKasbon(
  pembayaranList: SpkPembayaranStatusRow[],
  nilaiKontrak?: number,
  spkJenis: SpkJenis = "RUMAH",
): CanRequestKasbonResult {
  const calcRows = toSpkPembayaranCalcRows(pembayaranList);
  const pengurangRows: SpkPengurangTerminRow[] = pembayaranList
    .filter((p) => p.status !== "DRAFT")
    .map((p) =>
      toPengurangRow({
        id: p.id,
        jenis: p.jenis,
        nominal: p.nominal ?? 0,
        mengurangiTermin: p.mengurangiTermin,
      }),
    );
  const target = getKasbonTargetTermin(calcRows, {
    pengurangRows,
    spkJenis,
    ...(nilaiKontrak != null && nilaiKontrak > 0 ? { nilaiKontrak } : {}),
  });

  if (!target) {
    const scheme = getSpkTerminScheme(spkJenis);
    const lastTarget = getKasbonTargetSteps(scheme).at(-1);
    return {
      allowed: false,
      reason: lastTarget
        ? `Kasbon/upah tidak dapat diajukan: semua termin (${lastTarget.kasbonTargetLabel}) sudah dibayar.`
        : "Kasbon/upah tidak dapat diajukan pada tahap pembayaran ini.",
    };
  }

  if (nilaiKontrak != null && nilaiKontrak > 0) {
    const terminStatus = getTerminPaymentStatus(calcRows, spkJenis);
    const cap = getPengurangTerminCapacity(nilaiKontrak, pengurangRows, target, {
      terminStatus,
      spkJenis,
    });
    const labels = buildSpkKasbonTargetLabel(spkJenis);
    const targets = getKasbonTargetSteps(getSpkTerminScheme(spkJenis));
    const isFirstTarget = targets[0]?.jenis === target;
    const sisaPengurang = isFirstTarget ? cap.combinedSisa : cap.sisa;
    if (sisaPengurang <= 0) {
      return {
        allowed: false,
        reason: `Plafon ${labels[target]} untuk kasbon & upah sudah terpakai penuh.`,
      };
    }
    return {
      allowed: true,
      targetTermin: target,
      sisaPengurang,
      brutoTermin: cap.bruto,
      terpakai: cap.terpakai,
    };
  }

  return { allowed: true, targetTermin: target, sisaPengurang: 0, brutoTermin: 0, terpakai: 0 };
}

export function canRequestSpkPembayaran(
  jenis: SpkPembayaranJenis,
  spk: SpkNominalInput & { progress: number },
  pembayaranList: SpkPembayaranStatusRow[],
  spkJenis: SpkJenis = "RUMAH",
): { allowed: boolean; reason?: string } {
  const labels = buildSpkPembayaranJenisLabel(spkJenis);

  if (jenis === "KASBON" || jenis === "UPAH") {
    const check = canRequestKasbon(pembayaranList, spk.nilaiKontrak, spkJenis);
    if (!check.allowed) {
      return { allowed: false, reason: check.reason };
    }
    return { allowed: true };
  }

  if (!isTerminJenis(jenis, spkJenis)) {
    return {
      allowed: false,
      reason: "Jenis termin tidak sesuai dengan jenis SPK.",
    };
  }

  const calcRows = toSpkPembayaranCalcRows(pembayaranList);

  if (pembayaranList.some((p) => p.jenis === jenis)) {
    return { allowed: false, reason: "Pengajuan termin ini sudah ada." };
  }

  if (spk.progress < getMinProgressForJenis(jenis, spkJenis)) {
    return {
      allowed: false,
      reason: `Progress SPK minimal ${getMinProgressForJenis(jenis, spkJenis)}% untuk mengajukan termin ini.`,
    };
  }

  const prereq = getPrerequisiteJenis(jenis, spkJenis);
  if (
    prereq &&
    !pembayaranList.some(
      (p) => p.jenis === prereq && p.status === "SUDAH_DIBAYAR",
    )
  ) {
    return {
      allowed: false,
      reason: `Termin sebelumnya (${labels[prereq]}) harus sudah dibayar finance.`,
    };
  }

  return { allowed: true };
}

export function getSpkTerminJenisForRecalc(spkJenis: SpkJenis): SpkTerminPembayaranJenis[] {
  return getSpkTerminScheme(spkJenis).map((step) => step.jenis);
}

export { getSpkTerminScheme, getSpkTerminJenisOrder, isKasbonTargetTermin } from "./spkTerminScheme.js";
