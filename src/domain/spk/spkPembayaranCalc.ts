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
  jenis: SpkPembayaranJenis;
  status: "MENUNGGU_PEMBAYARAN" | "SUDAH_DIBAYAR";
  nominal: number;
  mengurangiTermin?: SpkKasbonTargetTermin | null;
  keterangan?: string | null;
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

/** FIFO: kasbon mengurangi termin 55 jika belum lunas, else termin 100 jika belum lunas. */
export function getKasbonTargetTermin(
  pembayaranList: SpkPembayaranCalcRow[],
): SpkKasbonTargetTermin | null {
  const t55 = pembayaranList.find((p) => p.jenis === "TERMIN_55");
  if (!t55 || t55.status !== "SUDAH_DIBAYAR") return "TERMIN_55";

  const t100 = pembayaranList.find((p) => p.jenis === "TERMIN_100");
  if (!t100 || t100.status !== "SUDAH_DIBAYAR") return "TERMIN_100";

  return null;
}

export function sumKasbonForTermin(
  pembayaranList: SpkPembayaranCalcRow[],
  termin: SpkKasbonTargetTermin,
): number {
  return pembayaranList
    .filter(
      (p) =>
        (p.jenis === "KASBON" || p.jenis === "UPAH") &&
        p.mengurangiTermin === termin,
    )
    .reduce((sum, p) => sum + p.nominal, 0);
}

export function calcTerminBruto(
  nilaiKontrak: number,
  termin: SpkKasbonTargetTermin,
): number {
  return termin === "TERMIN_55" ? nilaiKontrak * 0.5 : nilaiKontrak * 0.45;
}

export interface SpkPengurangTerminRow {
  id?: number;
  jenis: SpkPembayaranJenis;
  nominal: number;
  mengurangiTermin?: SpkKasbonTargetTermin | null;
}

export function sumPengurangForTermin(
  rows: SpkPengurangTerminRow[],
  termin: SpkKasbonTargetTermin,
  excludeId?: number,
): number {
  return rows
    .filter(
      (p) =>
        p.id !== excludeId &&
        (p.jenis === "KASBON" || p.jenis === "UPAH") &&
        p.mengurangiTermin === termin,
    )
    .reduce((sum, p) => sum + p.nominal, 0);
}

export function getPengurangTerminCapacity(
  nilaiKontrak: number,
  rows: SpkPengurangTerminRow[],
  termin: SpkKasbonTargetTermin,
  options?: { excludeId?: number; additionalNominal?: number },
) {
  const bruto = calcTerminBruto(nilaiKontrak, termin);
  const terpakai = sumPengurangForTermin(rows, termin, options?.excludeId);
  const sisa = Math.max(0, bruto - terpakai);
  const additional = options?.additionalNominal ?? 0;
  const sisaSetelah = sisa - additional;

  return {
    bruto,
    terpakai,
    sisa,
    additional,
    sisaSetelah,
    allowed: additional <= 0 || sisaSetelah >= 0,
  };
}

export function validatePengurangTerminNominal(
  nilaiKontrak: number,
  rows: SpkPengurangTerminRow[],
  termin: SpkKasbonTargetTermin,
  additionalNominal: number,
  excludeId?: number,
): { allowed: true } | { allowed: false; reason: string } {
  const cap = getPengurangTerminCapacity(nilaiKontrak, rows, termin, {
    excludeId,
    additionalNominal,
  });

  if (!cap.allowed) {
    return {
      allowed: false,
      reason: `Total kasbon & upah melebihi plafon ${SPK_KASBON_TARGET_LABEL[termin]}. Plafon termin: ${cap.bruto}, sudah terpakai: ${cap.terpakai}, sisa: ${cap.sisa}, nominal diajukan: ${additionalNominal}.`,
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
      const kasbon = sumKasbonForTermin(pembayaranList, "TERMIN_55");
      return Math.max(0, bruto - kasbon);
    }
    case "TERMIN_100": {
      const bruto = kontrak * 0.45;
      const kasbon = sumKasbonForTermin(pembayaranList, "TERMIN_100");
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
      const kasbon = sumKasbonForTermin(pembayaranList, "TERMIN_55");
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
      const kasbon = sumKasbonForTermin(pembayaranList, "TERMIN_100");
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
  status: "MENUNGGU_PEMBAYARAN" | "SUDAH_DIBAYAR" | "DRAFT";
  nominal?: number;
  mengurangiTermin?: SpkKasbonTargetTermin | null;
}

export function toSpkPembayaranCalcRows(
  pembayaranList: SpkPembayaranStatusRow[],
): SpkPembayaranCalcRow[] {
  // Draft tidak boleh mempengaruhi kalkulasi termin / plafon.
  return pembayaranList
    .filter((p) => p.status !== "DRAFT")
    .map((p) => ({
      jenis: p.jenis,
      status: p.status,
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
  const target = getKasbonTargetTermin(toSpkPembayaranCalcRows(pembayaranList));

  if (!target) {
    return {
      allowed: false,
      reason:
        "Kasbon/upah tidak dapat diajukan: kedua termin sudah dibayar.",
    };
  }

  if (nilaiKontrak != null && nilaiKontrak > 0) {
    const rows: SpkPengurangTerminRow[] = pembayaranList.map((p) => ({
      id: p.id,
      jenis: p.jenis,
      nominal: p.nominal ?? 0,
      mengurangiTermin: p.mengurangiTermin,
    }));
    const cap = getPengurangTerminCapacity(nilaiKontrak, rows, target);
    if (cap.sisa <= 0) {
      return {
        allowed: false,
        reason: `Plafon ${SPK_KASBON_TARGET_LABEL[target]} untuk kasbon & upah sudah terpakai penuh.`,
      };
    }
    return {
      allowed: true,
      targetTermin: target,
      sisaPengurang: cap.sisa,
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

  const nominal = calcSpkPembayaranNominal(jenis, spk, calcRows);
  if (nominal <= 0) {
    return {
      allowed: false,
      reason:
        "Nominal pembayaran tidak valid (≤ 0). Kasbon mungkin sudah melebihi nilai termin.",
    };
  }

  return { allowed: true };
}
