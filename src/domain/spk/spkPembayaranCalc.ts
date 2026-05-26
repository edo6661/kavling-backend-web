import type { SpkPembayaranJenis } from "@prisma/client";

export const SPK_PROGRESS_TERMIN_55 = 55;
export const SPK_PROGRESS_TERMIN_100 = 100;

export const SPK_PEMBAYARAN_JENIS_LABEL: Record<SpkPembayaranJenis, string> = {
  TERMIN_55: "Termin 55% (50% kontrak)",
  TERMIN_100: "Termin 100% (45% kontrak)",
  RETENSI: "Retensi (5% kontrak)",
};

export interface SpkNominalInput {
  nilaiKontrak: number;
  kasbonSebelumTermin2: number | null;
  kasbonSebelumTermin3: number | null;
}

export interface SpkPembayaranKalkulasiBaris {
  label: string;
  nilai: number;
  tipe: "positif" | "negatif" | "hasil";
}

export function buildSpkPembayaranKalkulasi(
  jenis: SpkPembayaranJenis,
  spk: SpkNominalInput,
): SpkPembayaranKalkulasiBaris[] {
  const kontrak = spk.nilaiKontrak;
  const baris: SpkPembayaranKalkulasiBaris[] = [
    { label: "Nilai kontrak SPK", nilai: kontrak, tipe: "positif" },
  ];

  switch (jenis) {
    case "TERMIN_55": {
      const bruto = kontrak * 0.5;
      const kasbon = spk.kasbonSebelumTermin2 ?? 0;
      baris.push({
        label: "50% nilai kontrak (termin progress ≥ 55%)",
        nilai: bruto,
        tipe: "positif",
      });
      if (kasbon > 0) {
        baris.push({
          label: "Kasbon sebelum 55%",
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
      const kasbon = spk.kasbonSebelumTermin3 ?? 0;
      baris.push({
        label: "45% nilai kontrak (termin progress 100%)",
        nilai: bruto,
        tipe: "positif",
      });
      if (kasbon > 0) {
        baris.push({
          label: "Kasbon sebelum 100%",
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
  }

  return baris;
}

export function calcSpkPembayaranNominal(
  jenis: SpkPembayaranJenis,
  spk: SpkNominalInput,
): number {
  const kontrak = spk.nilaiKontrak;
  switch (jenis) {
    case "TERMIN_55":
      return Math.max(0, kontrak * 0.5 - (spk.kasbonSebelumTermin2 ?? 0));
    case "TERMIN_100":
      return Math.max(0, kontrak * 0.45 - (spk.kasbonSebelumTermin3 ?? 0));
    case "RETENSI":
      return Math.max(0, kontrak * 0.05);
    default:
      return 0;
  }
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
}

export function calcNilaiBisaDitagihkan(
  spk: SpkNominalInput & { progress: number },
  pembayaranList: SpkPembayaranStatusRow[],
): number {
  const jenisOrder: SpkPembayaranJenis[] = ["TERMIN_55", "TERMIN_100", "RETENSI"];
  let total = 0;

  for (const jenis of jenisOrder) {
    if (pembayaranList.some((p) => p.jenis === jenis)) continue;
    if (spk.progress < getMinProgressForJenis(jenis)) continue;

    const prereq = getPrerequisiteJenis(jenis);
    if (
      prereq &&
      !pembayaranList.some(
        (p) => p.jenis === prereq && p.status === "SUDAH_DIBAYAR",
      )
    ) {
      continue;
    }

    total += calcSpkPembayaranNominal(jenis, spk);
  }

  return total;
}

export function canRequestSpkPembayaran(
  jenis: SpkPembayaranJenis,
  spk: SpkNominalInput & { progress: number },
  pembayaranList: SpkPembayaranStatusRow[],
): { allowed: boolean; reason?: string } {
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

  const nominal = calcSpkPembayaranNominal(jenis, spk);
  if (nominal <= 0) {
    return { allowed: false, reason: "Nominal pembayaran tidak valid (≤ 0)." };
  }

  return { allowed: true };
}
