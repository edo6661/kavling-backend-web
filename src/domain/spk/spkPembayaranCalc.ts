import type {
  SpkKasbonTargetTermin,
  SpkPembayaranJenis,
} from "@prisma/client";

export const SPK_PROGRESS_TERMIN_55 = 55;
export const SPK_PROGRESS_TERMIN_100 = 100;

export const SPK_PEMBAYARAN_JENIS_LABEL: Record<SpkPembayaranJenis, string> = {
  TERMIN_55: "Termin 55% (50% kontrak)",
  TERMIN_100: "Termin 100% (45% kontrak)",
  RETENSI: "Retensi (5% kontrak)",
  KASBON: "Kasbon",
  UPAH: "Upah tukang",
};

export const SPK_KASBON_TARGET_LABEL: Record<SpkKasbonTargetTermin, string> = {
  TERMIN_55: "Termin 55%",
  TERMIN_100: "Termin 100%",
};

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

export function calcTerminBruto(
  nilaiKontrak: number,
  termin: SpkKasbonTargetTermin,
): number {
  return termin === "TERMIN_55" ? nilaiKontrak * 0.5 : nilaiKontrak * 0.45;
}

export interface SpkPembayaranKalkulasiBaris {
  label: string;
  nilai: number;
  tipe: "positif" | "negatif" | "hasil";
}

const TERMIN_JENIS: SpkPembayaranJenis[] = ["TERMIN_55", "TERMIN_100", "RETENSI"];

export function isTerminJenis(
  jenis: SpkPembayaranJenis,
): jenis is "TERMIN_55" | "TERMIN_100" | "RETENSI" {
  return TERMIN_JENIS.includes(jenis);
}

export interface GetKasbonTargetTerminOptions {
  nilaiKontrak?: number;
  pengurangRows?: SpkPengurangTerminRow[];
}

/** Termin aktif untuk pengajuan kasbon/upah baru (perhatikan plafon termin 55 yang sudah habis). */
export function getKasbonTargetTermin(
  pembayaranList: SpkPembayaranCalcRow[],
  options?: GetKasbonTargetTerminOptions,
): SpkKasbonTargetTermin | null {
  const terminStatus = getTerminPaymentStatus(pembayaranList);
  const t55 = pembayaranList.find((p) => p.jenis === "TERMIN_55");
  const t100 = pembayaranList.find((p) => p.jenis === "TERMIN_100");

  if (!t55 || t55.status !== "SUDAH_DIBAYAR") {
    if (
      options?.nilaiKontrak != null &&
      options.nilaiKontrak > 0 &&
      options.pengurangRows
    ) {
      const bruto55 = calcTerminBruto(options.nilaiKontrak, "TERMIN_55");
      const alloc = allocatePengurangWaterfall(
        options.nilaiKontrak,
        options.pengurangRows,
        { terminStatus },
      );
      if (alloc.termin55 >= bruto55) {
        if (!t100 || t100.status !== "SUDAH_DIBAYAR") return "TERMIN_100";
        return null;
      }
    }
    return "TERMIN_55";
  }

  if (!t100 || t100.status !== "SUDAH_DIBAYAR") return "TERMIN_100";

  return null;
}

export interface PengurangRowSplit {
  termin55: number;
  termin100: number;
}

export function getPengurangRowWaterfallSplit(
  nilaiKontrak: number,
  rows: SpkPengurangTerminRow[],
  rowId: number,
  terminStatus?: TerminPaymentStatus,
): PengurangRowSplit {
  const without = allocatePengurangWaterfall(nilaiKontrak, rows, {
    excludeId: rowId,
    terminStatus,
  });
  const withRow = allocatePengurangWaterfall(nilaiKontrak, rows, {
    terminStatus,
  });
  return {
    termin55: withRow.termin55 - without.termin55,
    termin100: withRow.termin100 - without.termin100,
  };
}

function isPengurangJenis(jenis: SpkPembayaranJenis): jenis is "KASBON" | "UPAH" {
  return jenis === "KASBON" || jenis === "UPAH";
}

function sortPengurangRows(rows: SpkPengurangTerminRow[]): SpkPengurangTerminRow[] {
  return [...rows]
    .filter((p) => isPengurangJenis(p.jenis))
    .sort((a, b) => (a.id ?? Number.MAX_SAFE_INTEGER) - (b.id ?? Number.MAX_SAFE_INTEGER));
}

export interface PengurangWaterfallResult {
  termin55: number;
  termin100: number;
  overflow: number;
}

export interface TerminPaymentStatus {
  termin55Paid: boolean;
  termin100Paid: boolean;
}

export function getTerminPaymentStatus(
  pembayaranList: SpkPembayaranCalcRow[],
): TerminPaymentStatus {
  const t55 = pembayaranList.find((p) => p.jenis === "TERMIN_55");
  const t100 = pembayaranList.find((p) => p.jenis === "TERMIN_100");
  return {
    termin55Paid: t55?.status === "SUDAH_DIBAYAR",
    termin100Paid: t100?.status === "SUDAH_DIBAYAR",
  };
}

/** FIFO: isi plafon termin 55 dulu, kelebihan mengalir ke termin 100. */
export function allocatePengurangWaterfall(
  nilaiKontrak: number,
  rows: SpkPengurangTerminRow[],
  options?: {
    excludeId?: number;
    additionalNominal?: number;
    terminStatus?: TerminPaymentStatus;
  },
): PengurangWaterfallResult {
  const bruto55 = calcTerminBruto(nilaiKontrak, "TERMIN_55");
  const bruto100 = calcTerminBruto(nilaiKontrak, "TERMIN_100");

  let filled55 = options?.terminStatus?.termin55Paid ? bruto55 : 0;
  let filled100 = options?.terminStatus?.termin100Paid ? bruto100 : 0;

  const consume = (nominal: number) => {
    let remaining = nominal;
    const to55 = Math.min(remaining, Math.max(0, bruto55 - filled55));
    filled55 += to55;
    remaining -= to55;
    const to100 = Math.min(remaining, Math.max(0, bruto100 - filled100));
    filled100 += to100;
    remaining -= to100;
    return remaining;
  };

  for (const row of sortPengurangRows(rows)) {
    if (row.id === options?.excludeId) continue;
    consume(row.nominal);
  }

  const overflow = consume(options?.additionalNominal ?? 0);

  return { termin55: filled55, termin100: filled100, overflow };
}

function toPengurangRowsFromCalc(
  pembayaranList: SpkPembayaranCalcRow[],
): SpkPengurangTerminRow[] {
  return pembayaranList
    .filter((p) => isPengurangJenis(p.jenis))
    .map((p) => ({
      id: p.id,
      jenis: p.jenis,
      nominal: p.nominal,
      mengurangiTermin: p.mengurangiTermin,
    }));
}

export function sumKasbonForTermin(
  nilaiKontrak: number,
  pembayaranList: SpkPembayaranCalcRow[],
  termin: SpkKasbonTargetTermin,
): number {
  const allocated = allocatePengurangWaterfall(
    nilaiKontrak,
    toPengurangRowsFromCalc(pembayaranList),
    { terminStatus: getTerminPaymentStatus(pembayaranList) },
  );
  return termin === "TERMIN_55" ? allocated.termin55 : allocated.termin100;
}

export function sumPengurangForTermin(
  nilaiKontrak: number,
  rows: SpkPengurangTerminRow[],
  termin: SpkKasbonTargetTermin,
  excludeId?: number,
  terminStatus?: TerminPaymentStatus,
): number {
  const allocated = allocatePengurangWaterfall(nilaiKontrak, rows, {
    excludeId,
    terminStatus,
  });
  return termin === "TERMIN_55" ? allocated.termin55 : allocated.termin100;
}

export function getPengurangTerminCapacity(
  nilaiKontrak: number,
  rows: SpkPengurangTerminRow[],
  termin: SpkKasbonTargetTermin,
  options?: {
    excludeId?: number;
    additionalNominal?: number;
    terminStatus?: TerminPaymentStatus;
  },
) {
  const bruto55 = calcTerminBruto(nilaiKontrak, "TERMIN_55");
  const bruto100 = calcTerminBruto(nilaiKontrak, "TERMIN_100");
  const bruto = calcTerminBruto(nilaiKontrak, termin);

  const before = allocatePengurangWaterfall(nilaiKontrak, rows, {
    excludeId: options?.excludeId,
    terminStatus: options?.terminStatus,
  });
  const after = allocatePengurangWaterfall(nilaiKontrak, rows, options);

  const terpakai = termin === "TERMIN_55" ? before.termin55 : before.termin100;
  const sisa = Math.max(0, bruto - terpakai);
  const additional = options?.additionalNominal ?? 0;

  const terpakaiSetelah =
    termin === "TERMIN_55" ? after.termin55 : after.termin100;
  const sisaSetelah = Math.max(0, bruto - terpakaiSetelah);

  const spilloverKeTermin100 = Math.max(0, after.termin100 - before.termin100);
  const combinedSisa =
    Math.max(0, bruto55 - before.termin55) + Math.max(0, bruto100 - before.termin100);

  return {
    bruto,
    terpakai,
    sisa,
    additional,
    sisaSetelah,
    spilloverKeTermin100,
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
): { allowed: true } | { allowed: false; reason: string } {
  const cap = getPengurangTerminCapacity(nilaiKontrak, rows, termin, {
    excludeId,
    additionalNominal,
    terminStatus,
  });

  if (!cap.allowed) {
    const bruto55 = calcTerminBruto(nilaiKontrak, "TERMIN_55");
    const bruto100 = calcTerminBruto(nilaiKontrak, "TERMIN_100");
    return {
      allowed: false,
      reason:
        termin === "TERMIN_55"
          ? `Total kasbon & upah melebihi plafon gabungan termin 55% dan 100%. Plafon gabungan: ${bruto55 + bruto100}, sisa tersedia: ${cap.combinedSisa}, nominal diajukan: ${additionalNominal}.`
          : `Total kasbon & upah melebihi plafon ${SPK_KASBON_TARGET_LABEL[termin]}. Plafon termin: ${cap.bruto}, sudah terpakai: ${cap.terpakai}, sisa: ${cap.sisa}, nominal diajukan: ${additionalNominal}.`,
    };
  }

  return { allowed: true };
}

export function calcSpkPembayaranNominal(
  jenis: SpkPembayaranJenis,
  spk: SpkNominalInput,
  pembayaranList: SpkPembayaranCalcRow[] = [],
): number {
  const kontrak = spk.nilaiKontrak;
  switch (jenis) {
    case "TERMIN_55": {
      const bruto = kontrak * 0.5;
      const kasbon = sumKasbonForTermin(kontrak, pembayaranList, "TERMIN_55");
      return Math.max(0, bruto - kasbon);
    }
    case "TERMIN_100": {
      const bruto = kontrak * 0.45;
      const kasbon = sumKasbonForTermin(kontrak, pembayaranList, "TERMIN_100");
      return Math.max(0, bruto - kasbon);
    }
    case "RETENSI":
      return Math.max(0, kontrak * 0.05);
    case "KASBON":
      return 0;
    default:
      return 0;
  }
}

export function buildSpkPembayaranKalkulasi(
  jenis: SpkPembayaranJenis,
  spk: SpkNominalInput,
  pembayaranList: SpkPembayaranCalcRow[] = [],
): SpkPembayaranKalkulasiBaris[] {
  const kontrak = spk.nilaiKontrak;
  const baris: SpkPembayaranKalkulasiBaris[] = [
    { label: "Nilai kontrak SPK", nilai: kontrak, tipe: "positif" },
  ];

  switch (jenis) {
    case "TERMIN_55": {
      const bruto = kontrak * 0.5;
      const kasbon = sumKasbonForTermin(kontrak, pembayaranList, "TERMIN_55");
      baris.push({
        label: "50% nilai kontrak (termin progress ≥ 55%)",
        nilai: bruto,
        tipe: "positif",
      });
      if (kasbon > 0) {
        baris.push({
          label: "Total kasbon & upah (mengurangi termin 55%)",
          nilai: kasbon,
          tipe: "negatif",
        });
      }
      baris.push({
        label: "Nominal diajukan",
        nilai: Math.max(0, bruto - kasbon),
        tipe: "hasil",
      });
      break;
    }
    case "TERMIN_100": {
      const bruto = kontrak * 0.45;
      const kasbon = sumKasbonForTermin(kontrak, pembayaranList, "TERMIN_100");
      baris.push({
        label: "45% nilai kontrak (termin progress 100%)",
        nilai: bruto,
        tipe: "positif",
      });
      if (kasbon > 0) {
        baris.push({
          label: "Total kasbon & upah (mengurangi termin 100%)",
          nilai: kasbon,
          tipe: "negatif",
        });
      }
      baris.push({
        label: "Nominal diajukan",
        nilai: Math.max(0, bruto - kasbon),
        tipe: "hasil",
      });
      break;
    }
    case "RETENSI": {
      const bruto = kontrak * 0.05;
      baris.push({
        label: "Retensi 5% nilai kontrak",
        nilai: bruto,
        tipe: "positif",
      });
      baris.push({ label: "Nominal diajukan", nilai: bruto, tipe: "hasil" });
      break;
    }
    default:
      break;
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

export function getMinProgressForJenis(jenis: SpkPembayaranJenis): number {
  if (jenis === "TERMIN_55") return SPK_PROGRESS_TERMIN_55;
  return SPK_PROGRESS_TERMIN_100;
}

export function getPrerequisiteJenis(
  jenis: SpkPembayaranJenis,
): SpkPembayaranJenis | null {
  if (jenis === "TERMIN_100") return "TERMIN_55";
  if (jenis === "RETENSI") return "TERMIN_100";
  return null;
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
  // Draft tidak boleh mempengaruhi kalkulasi termin / plafon.
  return pembayaranList
    .filter((p) => p.status !== "DRAFT")
    .map((p) => ({
      id: p.id,
      jenis: p.jenis,
      status: normalizeCalcStatus(p.status),
      nominal: p.nominal ?? 0,
      mengurangiTermin:
        p.mengurangiTermin === "TERMIN_55" || p.mengurangiTermin === "TERMIN_100"
          ? p.mengurangiTermin
          : null,
    }));
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
): CanRequestKasbonResult {
  const calcRows = toSpkPembayaranCalcRows(pembayaranList);
  const pengurangRows: SpkPengurangTerminRow[] = pembayaranList
    .filter((p) => p.status !== "DRAFT")
    .map((p) => ({
      id: p.id,
      jenis: p.jenis,
      nominal: p.nominal ?? 0,
      mengurangiTermin: p.mengurangiTermin,
    }));
  const target = getKasbonTargetTermin(calcRows, {
    nilaiKontrak,
    pengurangRows,
  });

  if (!target) {
    return {
      allowed: false,
      reason:
        "Kasbon/upah tidak dapat diajukan: kedua termin sudah dibayar.",
    };
  }

  if (nilaiKontrak != null && nilaiKontrak > 0) {
    const terminStatus = getTerminPaymentStatus(calcRows);
    const cap = getPengurangTerminCapacity(nilaiKontrak, pengurangRows, target, {
      terminStatus,
    });
    const sisaPengurang =
      target === "TERMIN_55" ? cap.combinedSisa : cap.sisa;
    if (sisaPengurang <= 0) {
      return {
        allowed: false,
        reason: `Plafon ${SPK_KASBON_TARGET_LABEL[target]} untuk kasbon & upah sudah terpakai penuh.`,
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
): { allowed: boolean; reason?: string } {
  if (jenis === "KASBON" || jenis === "UPAH") {
    const check = canRequestKasbon(pembayaranList);
    if (!check.allowed) {
      return { allowed: false, reason: check.reason };
    }
    return { allowed: true };
  }

  const calcRows = toSpkPembayaranCalcRows(pembayaranList);

  if (pembayaranList.some((p) => p.jenis === jenis)) {
    return { allowed: false, reason: "Pengajuan termin ini sudah ada." };
  }

  if (spk.progress < getMinProgressForJenis(jenis)) {
    return {
      allowed: false,
      reason: `Progress SPK minimal ${getMinProgressForJenis(jenis)}% untuk mengajukan termin ini.`,
    };
  }

  const prereq = getPrerequisiteJenis(jenis);
  if (
    prereq &&
    !pembayaranList.some(
      (p) => p.jenis === prereq && p.status === "SUDAH_DIBAYAR",
    )
  ) {
    return {
      allowed: false,
      reason: `Termin sebelumnya (${SPK_PEMBAYARAN_JENIS_LABEL[prereq]}) harus sudah dibayar finance.`,
    };
  }

  return { allowed: true };
}
