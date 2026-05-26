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
      (p) => p.jenis === "KASBON" && p.mengurangiTermin === termin,
    )
    .reduce((sum, p) => sum + p.nominal, 0);
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
          label: "Total kasbon (mengurangi termin 55%)",
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
          label: "Total kasbon (mengurangi termin 100%)",
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
  jenis: SpkPembayaranJenis;
  status: "MENUNGGU_PEMBAYARAN" | "SUDAH_DIBAYAR";
  nominal?: number;
  mengurangiTermin?: SpkKasbonTargetTermin | null;
}

export function canRequestKasbon(
  pembayaranList: SpkPembayaranStatusRow[],
): { allowed: boolean; reason?: string; targetTermin?: SpkKasbonTargetTermin } {
  const target = getKasbonTargetTermin(
    pembayaranList.map((p) => ({
      jenis: p.jenis,
      status: p.status,
      nominal: p.nominal ?? 0,
      mengurangiTermin: p.mengurangiTermin,
    })),
  );

  if (!target) {
    return {
      allowed: false,
      reason:
        "Kasbon tidak dapat diajukan: kedua termin sudah dibayar.",
    };
  }

  return { allowed: true, targetTermin: target };
}

export function canRequestSpkPembayaran(
  jenis: SpkPembayaranJenis,
  spk: SpkNominalInput & { progress: number },
  pembayaranList: SpkPembayaranStatusRow[],
): { allowed: boolean; reason?: string } {
  if (jenis === "KASBON") {
    const check = canRequestKasbon(pembayaranList);
    return { allowed: check.allowed, reason: check.reason };
  }

  const calcRows = pembayaranList.map((p) => ({
    jenis: p.jenis,
    status: p.status,
    nominal: p.nominal ?? 0,
    mengurangiTermin: p.mengurangiTermin,
  }));

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
