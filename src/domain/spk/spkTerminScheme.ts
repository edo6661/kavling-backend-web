import type { SpkJenis } from "../entities/Spk.js";
import type { SpkKasbonTargetTermin, SpkPembayaranJenis } from "@prisma/client";

export type SpkTerminSchemeKey =
  | "RUMAH_DEFAULT"
  | "RUMAH_25_4"
  | "RUMAH_3_TERMIN"
  | "INFRA_20_6"
  | "INFRA_30_4"
  | "CUSTOM";

export type SpkTerminPembayaranJenis =
  | "TERMIN_55"
  | "TERMIN_100"
  | "TERMIN_RUMAH_25_1"
  | "TERMIN_RUMAH_25_2"
  | "TERMIN_RUMAH_25_3"
  | "TERMIN_RUMAH_25_4"
  | "TERMIN_RUMAH_3_1"
  | "TERMIN_RUMAH_3_2"
  | "TERMIN_RUMAH_3_3"
  | "TERMIN_INFRA_20_1"
  | "TERMIN_INFRA_20_2"
  | "TERMIN_INFRA_20_3"
  | "TERMIN_INFRA_20_4"
  | "TERMIN_INFRA_15"
  | "TERMIN_INFRA_30_1"
  | "TERMIN_INFRA_30_2"
  | "TERMIN_INFRA_30_3"
  | "TERMIN_INFRA_10"
  | "TERMIN_CUSTOM_1"
  | "TERMIN_CUSTOM_2"
  | "TERMIN_CUSTOM_3"
  | "TERMIN_CUSTOM_4"
  | "TERMIN_CUSTOM_5"
  | "TERMIN_CUSTOM_6"
  | "TERMIN_CUSTOM_7"
  | "TERMIN_CUSTOM_8"
  | "TERMIN_CUSTOM_9"
  | "TERMIN_CUSTOM_10"
  | "RETENSI";

export const CUSTOM_TERMIN_JENIS_KEYS: SpkTerminPembayaranJenis[] = [
  "TERMIN_CUSTOM_1",
  "TERMIN_CUSTOM_2",
  "TERMIN_CUSTOM_3",
  "TERMIN_CUSTOM_4",
  "TERMIN_CUSTOM_5",
  "TERMIN_CUSTOM_6",
  "TERMIN_CUSTOM_7",
  "TERMIN_CUSTOM_8",
  "TERMIN_CUSTOM_9",
  "TERMIN_CUSTOM_10",
];

export interface SpkCustomTerminStep {
  urutan: number;
  label: string;
  shortLabel?: string | undefined;
  kontrakFraction: number; // 0.0 to 1.0 (misal 0.35 untuk 35%)
  minProgress: number; // 0 to 100
  isRetensi?: boolean | undefined;
}

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

export const SPK_TERMIN_SCHEME_RUMAH_25_4: SpkTerminStepConfig[] = [
  {
    jenis: "TERMIN_RUMAH_25_1",
    minProgress: 25,
    kontrakFraction: 0.25,
    label: "Termin 1 (25% progress)",
    shortLabel: "25%·1",
    kasbonTargetLabel: "Termin 1 (25%)",
  },
  {
    jenis: "TERMIN_RUMAH_25_2",
    minProgress: 50,
    kontrakFraction: 0.25,
    label: "Termin 2 (50% progress)",
    shortLabel: "25%·2",
    kasbonTargetLabel: "Termin 2 (50%)",
  },
  {
    jenis: "TERMIN_RUMAH_25_3",
    minProgress: 75,
    kontrakFraction: 0.25,
    label: "Termin 3 (75% progress)",
    shortLabel: "25%·3",
    kasbonTargetLabel: "Termin 3 (75%)",
  },
  {
    jenis: "TERMIN_RUMAH_25_4",
    minProgress: 95,
    kontrakFraction: 0.2,
    label: "Termin 4 (95% progress)",
    shortLabel: "20%",
    kasbonTargetLabel: "Termin 4 (95%)",
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

export const SPK_TERMIN_SCHEME_RUMAH_3_TERMIN: SpkTerminStepConfig[] = [
  {
    jenis: "TERMIN_RUMAH_3_1",
    minProgress: 35,
    kontrakFraction: 0.35,
    label: "Termin 1 (35% progress)",
    shortLabel: "35%·1",
    kasbonTargetLabel: "Termin 1 (35%)",
  },
  {
    jenis: "TERMIN_RUMAH_3_2",
    minProgress: 70,
    kontrakFraction: 0.35,
    label: "Termin 2 (70% progress)",
    shortLabel: "35%·2",
    kasbonTargetLabel: "Termin 2 (70%)",
  },
  {
    jenis: "TERMIN_RUMAH_3_3",
    minProgress: 95,
    kontrakFraction: 0.25,
    label: "Termin 3 (95% progress)",
    shortLabel: "25%",
    kasbonTargetLabel: "Termin 3 (95%)",
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

const SCHEME_MAP: Record<Exclude<SpkTerminSchemeKey, "CUSTOM">, SpkTerminStepConfig[]> = {
  RUMAH_DEFAULT: SPK_TERMIN_SCHEME_RUMAH,
  RUMAH_25_4: SPK_TERMIN_SCHEME_RUMAH_25_4,
  RUMAH_3_TERMIN: SPK_TERMIN_SCHEME_RUMAH_3_TERMIN,
  INFRA_20_6: SPK_TERMIN_SCHEME_INFRA_20_6,
  INFRA_30_4: SPK_TERMIN_SCHEME_INFRA_30_4,
};

export interface SpkTerminSchemeInput {
  jenis?: SpkJenis;
  terminScheme?: SpkTerminSchemeKey | null;
  terminConfig?: SpkCustomTerminStep[] | string | null;
}

export function defaultTerminSchemeForJenis(
  jenis: SpkJenis = "RUMAH",
): SpkTerminSchemeKey {
  return jenis === "INFRASTRUKTUR" ? "INFRA_20_6" : "RUMAH_DEFAULT";
}

export function resolveSpkTerminScheme(
  spk: SpkTerminSchemeInput,
): SpkTerminSchemeKey {
  if (spk.terminScheme) return spk.terminScheme;
  return defaultTerminSchemeForJenis(spk.jenis);
}

export function parseCustomTerminSteps(
  rawConfig: SpkCustomTerminStep[] | string | null | undefined,
): SpkTerminStepConfig[] {
  if (!rawConfig) return [];
  let parsed: SpkCustomTerminStep[];
  if (typeof rawConfig === "string") {
    try {
      parsed = JSON.parse(rawConfig);
    } catch {
      return [];
    }
  } else {
    parsed = rawConfig;
  }
  if (!Array.isArray(parsed) || parsed.length === 0) return [];

  const result: SpkTerminStepConfig[] = [];
  let customIndex = 0;

  for (let i = 0; i < parsed.length; i++) {
    const step = parsed[i]!;
    const isRet =
      step.isRetensi === true ||
      step.label.trim().toLowerCase() === "retensi";

    let stepJenis: SpkTerminPembayaranJenis;
    if (isRet) {
      stepJenis = "RETENSI";
    } else {
      stepJenis =
        CUSTOM_TERMIN_JENIS_KEYS[customIndex] ??
        (`TERMIN_CUSTOM_${customIndex + 1}` as SpkTerminPembayaranJenis);
      customIndex++;
    }

    const pctNumber = Math.round(step.kontrakFraction * 100);
    const shortLabel =
      step.shortLabel?.trim() ||
      (isRet ? "Ret." : `${pctNumber}%·${step.urutan || i + 1}`);

    result.push({
      jenis: stepJenis,
      minProgress: Number(step.minProgress) || 0,
      kontrakFraction: Number(step.kontrakFraction) || 0,
      label: step.label.trim() || `Termin ${step.urutan || i + 1} (${pctNumber}%)`,
      shortLabel,
      kasbonTargetLabel: isRet ? "" : (step.label.trim() || `Termin ${step.urutan || i + 1}`),
    });
  }

  return result;
}

export function validateCustomTerminConfig(steps: SpkCustomTerminStep[]): {
  valid: boolean;
  message?: string;
} {
  if (!Array.isArray(steps) || steps.length < 1) {
    return { valid: false, message: "Minimal harus ada 1 termin." };
  }
  if (steps.length > 11) {
    return { valid: false, message: "Maksimal 10 termin bertahap dan 1 retensi." };
  }

  let totalFraction = 0;
  let prevMinProgress = -1;

  for (let i = 0; i < steps.length; i++) {
    const s = steps[i]!;
    if (!s.label?.trim()) {
      return { valid: false, message: `Nama baris ke-${i + 1} wajib diisi.` };
    }
    if (s.kontrakFraction <= 0 || s.kontrakFraction > 1) {
      return {
        valid: false,
        message: `Persentase baris ke-${i + 1} harus lebih dari 0% dan maksimal 100%.`,
      };
    }
    if (s.minProgress < 0 || s.minProgress > 100) {
      return {
        valid: false,
        message: `Target progress baris ke-${i + 1} harus antara 0% dan 100%.`,
      };
    }
    if (s.minProgress < prevMinProgress) {
      return {
        valid: false,
        message: `Target progress baris ke-${i + 1} (${s.minProgress}%) tidak boleh lebih kecil dari baris sebelumnya (${prevMinProgress}%).`,
      };
    }
    prevMinProgress = s.minProgress;
    totalFraction += s.kontrakFraction;
  }

  // Toleransi rounding 0.001 (0.1%)
  if (Math.abs(totalFraction - 1.0) > 0.001) {
    const totalPercent = Math.round(totalFraction * 100);
    return {
      valid: false,
      message: `Total persentase kontrak harus tepat 100% (saat ini ${totalPercent}%).`,
    };
  }

  return { valid: true };
}

export function getSpkTerminScheme(
  schemeOrSpk: SpkTerminSchemeKey | SpkTerminSchemeInput = "RUMAH_DEFAULT",
): SpkTerminStepConfig[] {
  if (typeof schemeOrSpk === "object" && schemeOrSpk !== null) {
    if (
      schemeOrSpk.terminScheme === "CUSTOM" ||
      (schemeOrSpk.terminConfig &&
        Array.isArray(schemeOrSpk.terminConfig) &&
        schemeOrSpk.terminConfig.length > 0)
    ) {
      const customSteps = parseCustomTerminSteps(schemeOrSpk.terminConfig);
      if (customSteps.length > 0) return customSteps;
    }
    const key = resolveSpkTerminScheme(schemeOrSpk);
    if (key !== "CUSTOM") return SCHEME_MAP[key];
    return SCHEME_MAP.RUMAH_DEFAULT;
  }

  if (schemeOrSpk === "CUSTOM") {
    return SCHEME_MAP.RUMAH_DEFAULT;
  }

  return SCHEME_MAP[schemeOrSpk] ?? SCHEME_MAP.RUMAH_DEFAULT;
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
  return getSpkTerminJenisOrder(schemeOrSpk).includes(
    jenis as SpkTerminPembayaranJenis,
  );
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
export function buildAllSpkPembayaranJenisLabel(): Record<
  SpkPembayaranJenis,
  string
> {
  const labels = {
    KASBON: "Kasbon",
    UPAH: "Upah tukang",
  } as Record<SpkPembayaranJenis, string>;

  for (const scheme of Object.values(SCHEME_MAP)) {
    for (const step of scheme) {
      labels[step.jenis] = step.label;
    }
  }

  for (let i = 0; i < CUSTOM_TERMIN_JENIS_KEYS.length; i++) {
    const k = CUSTOM_TERMIN_JENIS_KEYS[i]!;
    if (!labels[k]) labels[k] = `Termin Kustom ${i + 1}`;
  }

  return labels;
}

export function buildAllSpkKasbonTargetLabel(): Record<
  SpkKasbonTargetTermin,
  string
> {
  const labels = {} as Record<SpkKasbonTargetTermin, string>;
  for (const key of Object.keys(SCHEME_MAP) as Exclude<SpkTerminSchemeKey, "CUSTOM">[]) {
    Object.assign(labels, buildSpkKasbonTargetLabel(key));
  }
  for (let i = 0; i < CUSTOM_TERMIN_JENIS_KEYS.length; i++) {
    const k = CUSTOM_TERMIN_JENIS_KEYS[i]! as SpkKasbonTargetTermin;
    if (!labels[k]) labels[k] = `Termin Kustom ${i + 1}`;
  }
  return labels;
}

export function validateTerminSchemeForJenis(
  jenis: SpkJenis,
  terminScheme: SpkTerminSchemeKey,
): void {
  if (terminScheme === "CUSTOM") return;
  if (
    jenis === "RUMAH" &&
    terminScheme !== "RUMAH_DEFAULT" &&
    terminScheme !== "RUMAH_25_4" &&
    terminScheme !== "RUMAH_3_TERMIN"
  ) {
    throw new Error(
      "SPK rumah hanya mendukung skema termin rumah atau CUSTOM.",
    );
  }
  if (
    jenis === "INFRASTRUKTUR" &&
    (terminScheme === "RUMAH_DEFAULT" ||
      terminScheme === "RUMAH_25_4" ||
      terminScheme === "RUMAH_3_TERMIN")
  ) {
    throw new Error("SPK infrastruktur memerlukan skema termin infra atau CUSTOM.");
  }
}
