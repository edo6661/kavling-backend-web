import { AgentType } from "@prisma/client";

export interface AgentCommercialSource {
  type: AgentType | string;
  feeMarketingPct?: unknown;
  feeClosingNominal?: unknown;
  potonganPph?: unknown;
  namaBank?: string | null;
  noRekening?: string | null;
  atasNamaRekening?: string | null;
  perusahaanAgent?: {
    feeMarketingPct?: unknown;
    feeClosingNominal?: unknown;
    potonganPph?: unknown;
    isPkp?: boolean;
    namaBank?: string | null;
    noRekening?: string | null;
    atasNamaRekening?: string | null;
  } | null;
}

export interface ResolvedAgentCommercialProfile {
  feeMarketingPct: number | null;
  feeClosingNominal: number | null;
  potonganPph: number | null;
  isPkp: boolean;
  namaBank: string | null;
  noRekening: string | null;
  atasNamaRekening: string | null;
  fromPerusahaan: boolean;
}

function toNum(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function isAgentPerusahaan(type: AgentType | string): boolean {
  return type === AgentType.PERUSAHAAN || type === "PERUSAHAAN";
}

/** Agent perusahaan: fee, PPh, dan rekening diambil dari master perusahaan */
export function resolveAgentCommercialProfile(
  agent: AgentCommercialSource,
): ResolvedAgentCommercialProfile {
  const usePerusahaan =
    isAgentPerusahaan(agent.type) && agent.perusahaanAgent != null;
  const src = usePerusahaan ? agent.perusahaanAgent! : agent;

  return {
    feeMarketingPct: toNum(src.feeMarketingPct),
    feeClosingNominal: toNum(src.feeClosingNominal),
    potonganPph: toNum(src.potonganPph),
    isPkp: usePerusahaan ? !!agent.perusahaanAgent?.isPkp : false,
    namaBank: src.namaBank ?? null,
    noRekening: src.noRekening ?? null,
    atasNamaRekening: src.atasNamaRekening ?? null,
    fromPerusahaan: usePerusahaan,
  };
}
