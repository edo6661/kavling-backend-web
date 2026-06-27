import type { SpkJenis } from "../entities/Spk.js";
import type { SpkKasbonTargetTermin, SpkPembayaranJenis } from "@prisma/client";

export type SpkTerminSchemeKey = "RUMAH_DEFAULT" | "INFRA_20_6" | "INFRA_30_4";

export type SpkTerminPembayaranJenis = Extract<
  SpkPembayaranJenis,
  | "TERMIN_55"
  | "TERMIN_100"
  | "TERMIN_INFRA_20_1"
  | "TERMIN_INFRA_20_2"
  | "TERMIN_INFRA_20_3"
  | "TERMIN_INFRA_20_4"
  | "TERMIN_INFRA_15"
  | "TERMIN_INFRA_30_1"
  | "TERMIN_INFRA_30_2"
  | "TERMIN_INFRA_30_3"
  | "TERMIN_INFRA_10"
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

export const SPK_TERMIN_SCHEME_INFRA_20_6: SpkTerminStepConfig[] = [
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

export const SPK_TERMIN_SCHEME_INFRA_30_4: SpkTerminStepConfig[] = [
  {
    jenis: "TERMIN_INFRA_30_1",
    minProgress: 30,
    kontrakFraction: 0.3,
    label: "Termin 30% (progress ≥ 30%)",
    shortLabel: "30%·1",
    kasbonTargetLabel: "Termin 30% (1)",
  },
  {
    jenis: "TERMIN_INFRA_30_2",
    minProgress: 60,
    kontrakFraction: 0.3,
    label: "Termin 30% (progress ≥ 60%)",
    shortLabel: "30%·2",
    kasbonTargetLabel: "Termin 30% (2)",
  },
  {
    jenis: "TERMIN_INFRA_30_3",
    minProgress: 90,
    kontrakFraction: 0.3,
    label: "Termin 30% (progress ≥ 90%)",
    shortLabel: "30%·3",
    kasbonTargetLabel: "Termin 30% (3)",
  },
  {
    jenis: "TERMIN_INFRA_10",
    minProgress: 100,
    kontrakFraction: 0.1,
    label: "Termin 10% (progress 100%)",
    shortLabel: "10%",
    kasbonTargetLabel: "Termin 10%",
  },
];

/** @deprecated Use SPK_TERMIN_SCHEME_INFRA_20_6 */
export const SPK_TERMIN_SCHEME_INFRA = SPK_TERMIN_SCHEME_INFRA_20_6;

const SCHEME_MAP: Record<SpkTerminSchemeKey, SpkTerminStepConfig[]> = {
  RUMAH_DEFAULT: SPK_TERMIN_SCHEME_RUMAH,
  INFRA_20_6: SPK_TERMIN_SCHEME_INFRA_20_6,
  INFRA_30_4: SPK_TERMIN_SCHEME_INFRA_30_4,
};

export interface SpkTerminSchemeInput {
  jenis: SpkJenis;
  terminScheme?: SpkTerminSchemeKey | null;
}

export function defaultTerminSchemeForJenis(jenis: SpkJenis): SpkTerminSchemeKey {
  return jenis === "INFRASTRUKTUR" ? "INFRA_20_6" : "RUMAH_DEFAULT";
}

export function resolveSpkTerminScheme(spk: SpkTerminSchemeInput): SpkTerminSchemeKey {
  if (spk.terminScheme) return spk.terminScheme;
  return defaultTerminSchemeForJenis(spk.jenis);
}

export function getSpkTerminScheme(
  schemeOrSpk: SpkTerminSchemeKey | SpkTerminSchemeInput = "RUMAH_DEFAULT",
): SpkTerminStepConfig[] {
  const key =
    typeof schemeOrSpk === "string"
      ? schemeOrSpk
      : resolveSpkTerminScheme(schemeOrSpk);
  return SCHEME_MAP[key];
}

export function getSpkTerminJenisOrder(
  schemeOrSpk: SpkTerminSchemeKey | SpkTerminSchemeInput = "RUMAH_DEFAULT",
): SpkTerminPembayaranJenis[] {
  return getSpkTerminScheme(schemeOrSpk).map((step) => step.jenis);
}

export function getKasbonTargetSteps(
  scheme: SpkTerminStepConfig[],
): SpkTerminStepConfig[] {
  return scheme.filter((step) => step.jenis !== "RETENSI");
}

export function isTerminJenisForScheme(
  jenis: SpkPembayaranJenis,
  schemeOrSpk: SpkTerminSchemeKey | SpkTerminSchemeInput,
): jenis is SpkTerminPembayaranJenis {
  return getSpkTerminJenisOrder(schemeOrSpk).includes(jenis as SpkTerminPembayaranJenis);
}

/** @deprecated Use isTerminJenisForScheme with resolveSpkTerminScheme */
export function isTerminJenisForSpk(
  jenis: SpkPembayaranJenis,
  spkJenis: SpkJenis,
): jenis is SpkTerminPembayaranJenis {
  return isTerminJenisForScheme(jenis, defaultTerminSchemeForJenis(spkJenis));
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
  schemeOrSpk: SpkTerminSchemeKey | SpkTerminSchemeInput = "RUMAH_DEFAULT",
): Record<SpkPembayaranJenis, string> {
  const labels = {
    KASBON: "Kasbon",
    UPAH: "Upah tukang",
  } as Record<SpkPembayaranJenis, string>;

  for (const step of getSpkTerminScheme(schemeOrSpk)) {
    labels[step.jenis] = step.label;
  }

  return labels;
}

export function buildSpkKasbonTargetLabel(
  schemeOrSpk: SpkTerminSchemeKey | SpkTerminSchemeInput = "RUMAH_DEFAULT",
): Record<SpkKasbonTargetTermin, string> {
  const labels = {} as Record<SpkKasbonTargetTermin, string>;
  for (const step of getKasbonTargetSteps(getSpkTerminScheme(schemeOrSpk))) {
    labels[step.jenis as SpkKasbonTargetTermin] = step.kasbonTargetLabel;
  }
  return labels;
}

/** Gabungan label semua skema untuk laporan & finance. */
export function buildAllSpkPembayaranJenisLabel(): Record<SpkPembayaranJenis, string> {
  const labels = {
    KASBON: "Kasbon",
    UPAH: "Upah tukang",
  } as Record<SpkPembayaranJenis, string>;

  for (const scheme of Object.values(SCHEME_MAP)) {
    for (const step of scheme) {
      labels[step.jenis] = step.label;
    }
  }

  return labels;
}

export function buildAllSpkKasbonTargetLabel(): Record<SpkKasbonTargetTermin, string> {
  const labels = {} as Record<SpkKasbonTargetTermin, string>;
  for (const key of Object.keys(SCHEME_MAP) as SpkTerminSchemeKey[]) {
    Object.assign(labels, buildSpkKasbonTargetLabel(key));
  }
  return labels;
}

export function validateTerminSchemeForJenis(
  jenis: SpkJenis,
  terminScheme: SpkTerminSchemeKey,
): void {
  if (jenis === "RUMAH" && terminScheme !== "RUMAH_DEFAULT") {
    throw new Error("SPK rumah hanya mendukung skema termin RUMAH_DEFAULT.");
  }
  if (jenis === "INFRASTRUKTUR" && terminScheme === "RUMAH_DEFAULT") {
    throw new Error("SPK infrastruktur memerlukan skema termin infra.");
  }
}
