import type { SpkJenis } from "../entities/Spk.js";
import type { SpkKasbonTargetTermin, SpkPembayaranJenis } from "@prisma/client";

export type SpkTerminPembayaranJenis = Extract<
  SpkPembayaranJenis,
  | "TERMIN_55"
  | "TERMIN_100"
  | "TERMIN_INFRA_20_1"
  | "TERMIN_INFRA_20_2"
  | "TERMIN_INFRA_20_3"
  | "TERMIN_INFRA_20_4"
  | "TERMIN_INFRA_15"
  | "RETENSI"
>;

export interface SpkTerminStepConfig {
  jenis: SpkTerminPembayaranJenis;
  minProgress: number;
  kontrakFraction: number;
  label: string;
  shortLabel: string;
  kasbonTargetLabel: string;
}

export const SPK_TERMIN_SCHEME_RUMAH: SpkTerminStepConfig[] = [
  {
    jenis: "TERMIN_55",
    minProgress: 55,
    kontrakFraction: 0.5,
    label: "Termin 55% (50% kontrak)",
    shortLabel: "55%",
    kasbonTargetLabel: "Termin 55%",
  },
  {
    jenis: "TERMIN_100",
    minProgress: 100,
    kontrakFraction: 0.45,
    label: "Termin 100% (45% kontrak)",
    shortLabel: "100%",
    kasbonTargetLabel: "Termin 100%",
  },
  {
    jenis: "RETENSI",
    minProgress: 100,
    kontrakFraction: 0.05,
    label: "Retensi (5% kontrak)",
    shortLabel: "Ret.",
    kasbonTargetLabel: "",
  },
];

export const SPK_TERMIN_SCHEME_INFRA: SpkTerminStepConfig[] = [
  {
    jenis: "TERMIN_INFRA_20_1",
    minProgress: 20,
    kontrakFraction: 0.2,
    label: "Termin 20% (progress ≥ 20%)",
    shortLabel: "20%·1",
    kasbonTargetLabel: "Termin 20% (1)",
  },
  {
    jenis: "TERMIN_INFRA_20_2",
    minProgress: 40,
    kontrakFraction: 0.2,
    label: "Termin 20% (progress ≥ 40%)",
    shortLabel: "20%·2",
    kasbonTargetLabel: "Termin 20% (2)",
  },
  {
    jenis: "TERMIN_INFRA_20_3",
    minProgress: 60,
    kontrakFraction: 0.2,
    label: "Termin 20% (progress ≥ 60%)",
    shortLabel: "20%·3",
    kasbonTargetLabel: "Termin 20% (3)",
  },
  {
    jenis: "TERMIN_INFRA_20_4",
    minProgress: 80,
    kontrakFraction: 0.2,
    label: "Termin 20% (progress ≥ 80%)",
    shortLabel: "20%·4",
    kasbonTargetLabel: "Termin 20% (4)",
  },
  {
    jenis: "TERMIN_INFRA_15",
    minProgress: 100,
    kontrakFraction: 0.15,
    label: "Termin 15% (progress 100%)",
    shortLabel: "15%",
    kasbonTargetLabel: "Termin 15%",
  },
  {
    jenis: "RETENSI",
    minProgress: 100,
    kontrakFraction: 0.05,
    label: "Retensi (5% kontrak)",
    shortLabel: "Ret.",
    kasbonTargetLabel: "",
  },
];

export function getSpkTerminScheme(spkJenis: SpkJenis = "RUMAH"): SpkTerminStepConfig[] {
  return spkJenis === "INFRASTRUKTUR"
    ? SPK_TERMIN_SCHEME_INFRA
    : SPK_TERMIN_SCHEME_RUMAH;
}

export function getSpkTerminJenisOrder(spkJenis: SpkJenis = "RUMAH"): SpkTerminPembayaranJenis[] {
  return getSpkTerminScheme(spkJenis).map((step) => step.jenis);
}

export function getKasbonTargetSteps(
  scheme: SpkTerminStepConfig[],
): SpkTerminStepConfig[] {
  return scheme.filter((step) => step.jenis !== "RETENSI");
}

export function isTerminJenisForSpk(
  jenis: SpkPembayaranJenis,
  spkJenis: SpkJenis,
): jenis is SpkTerminPembayaranJenis {
  return getSpkTerminJenisOrder(spkJenis).includes(jenis as SpkTerminPembayaranJenis);
}

export function isKasbonTargetTermin(
  value: SpkKasbonTargetTermin | null | undefined,
): value is SpkKasbonTargetTermin {
  return value != null;
}

export function getTerminStep(
  scheme: SpkTerminStepConfig[],
  jenis: SpkTerminPembayaranJenis,
): SpkTerminStepConfig | undefined {
  return scheme.find((step) => step.jenis === jenis);
}

export function getPrerequisiteTerminJenis(
  scheme: SpkTerminStepConfig[],
  jenis: SpkTerminPembayaranJenis,
): SpkTerminPembayaranJenis | null {
  const index = scheme.findIndex((step) => step.jenis === jenis);
  if (index <= 0) return null;
  return scheme[index - 1]!.jenis;
}

export function buildSpkPembayaranJenisLabel(
  spkJenis: SpkJenis = "RUMAH",
): Record<SpkPembayaranJenis, string> {
  const labels = {
    KASBON: "Kasbon",
    UPAH: "Upah tukang",
  } as Record<SpkPembayaranJenis, string>;

  for (const step of getSpkTerminScheme(spkJenis)) {
    labels[step.jenis] = step.label;
  }

  return labels;
}

export function buildSpkKasbonTargetLabel(
  spkJenis: SpkJenis = "RUMAH",
): Record<SpkKasbonTargetTermin, string> {
  const labels = {} as Record<SpkKasbonTargetTermin, string>;
  for (const step of getKasbonTargetSteps(getSpkTerminScheme(spkJenis))) {
    labels[step.jenis as SpkKasbonTargetTermin] = step.kasbonTargetLabel;
  }
  return labels;
}

/** Gabungan label rumah + infra untuk laporan & finance (semua jenis termin). */
export function buildAllSpkPembayaranJenisLabel(): Record<SpkPembayaranJenis, string> {
  return {
    ...buildSpkPembayaranJenisLabel("RUMAH"),
    ...buildSpkPembayaranJenisLabel("INFRASTRUKTUR"),
  };
}

export function buildAllSpkKasbonTargetLabel(): Record<SpkKasbonTargetTermin, string> {
  return {
    ...buildSpkKasbonTargetLabel("RUMAH"),
    ...buildSpkKasbonTargetLabel("INFRASTRUKTUR"),
  };
}
