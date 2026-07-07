import { describe, expect, it } from "vitest";
import {
  IN_HOUSE_FEE_MARKETING_PCT,
  calcPencairanSubmit,
  formatPencairanTahapLabel,
  getFullMarketingFee,
  getPencairanPreview,
  hasAnyEligiblePencairan,
  type AgentPencairanCalcContext,
  type PencairanSudahDiajukan,
} from "./agentPencairanCalc.js";

const NILAI_AJB = 332_800_000;
const IN_HOUSE_MARKETING = NILAI_AJB * (IN_HOUSE_FEE_MARKETING_PCT / 100);

const emptySudah: PencairanSudahDiajukan = {
  closingNominal: 0,
  marketingNominal: 0,
  tahaps: [],
};

function baseCtx(
  overrides: Partial<AgentPencairanCalcContext> = {},
): AgentPencairanCalcContext {
  return {
    penjualanStatus: "AKTIF",
    bookingFeeLunasBatal: false,
    caraPembayaran: "CASH_KERAS",
    hargaJual: 406_000_000,
    agent: {
      feeMarketingPct: 5,
      feeClosingNominal: 1_500_000,
      potonganPph: 0,
      isPkp: false,
      isInHouse: false,
    },
    feeAgent: { closingNominal: null },
    nilaiAjb: NILAI_AJB,
    tagihanList: [
      { tujuan: "BOOKING_FEE", pembayaran: "CASH", status: "LUNAS" },
    ],
    hasPpjb: true,
    hasSp3k: false,
    hasAjb: false,
    hasAkadKredit: true,
    ...overrides,
  };
}

describe("formatPencairanTahapLabel", () => {
  it("membedakan cash vs KPR pada tahap AJB", () => {
    expect(formatPencairanTahapLabel("PPJB", "CASH_KERAS")).toBe("50% PPJB");
    expect(formatPencairanTahapLabel("AJB", "CASH_KERAS")).toBe("50% AJB");
    expect(formatPencairanTahapLabel("AJB", "KPR")).toBe("Komisi KPR");
  });
});

describe("agentPencairanCalc — in-house memakai syarat yang sama, fee tetap 0,5%", () => {
  it("komisi in-house = 0,5% dari nilai AJB", () => {
    const ctx = baseCtx({
      agent: {
        feeMarketingPct: 99,
        feeClosingNominal: 9_999_999,
        potonganPph: 0,
        isPkp: false,
        isInHouse: true,
      },
    });

    expect(getFullMarketingFee(ctx)).toBe(IN_HOUSE_MARKETING);
    expect(IN_HOUSE_MARKETING).toBe(1_664_000);
  });

  it("in-house tidak punya closing fee", () => {
    const preview = getPencairanPreview(
      baseCtx({
        agent: {
          feeMarketingPct: 5,
          feeClosingNominal: 1_500_000,
          potonganPph: 0,
          isPkp: false,
          isInHouse: true,
        },
      }),
      emptySudah,
    );

    const closing = preview.komponen.find((k) => k.key === "closing")!;
    expect(closing.nominalPenuh).toBe(0);
    expect(closing.eligible).toBe(false);
  });

  it("in-house cash: tahap PPJB boleh tanpa file AJB (sama agent eksternal)", () => {
    const ctx = baseCtx({
      agent: {
        feeMarketingPct: 5,
        feeClosingNominal: 0,
        potonganPph: 0,
        isPkp: false,
        isInHouse: true,
      },
      hasAjb: false,
    });

    const preview = getPencairanPreview(ctx, emptySudah);
    const marketing = preview.komponen.find((k) => k.key === "marketing")!;

    expect(marketing.eligible).toBe(true);
    // nominalSisa menampilkan total sisa kedua bucket; submit PPJB hanya setengah
    expect(marketing.nominalSisa).toBe(IN_HOUSE_MARKETING);

    const submit = calcPencairanSubmit(ctx, emptySudah, ["marketing"]);
    expect(submit.tahap).toBe("PPJB");
    expect(submit.marketingNominal).toBe(IN_HOUSE_MARKETING / 2);
  });

  it("in-house cash: sisa 50% AJB tetap butuh file AJB", () => {
    const ctx = baseCtx({
      agent: {
        feeMarketingPct: 5,
        feeClosingNominal: 0,
        potonganPph: 0,
        isPkp: false,
        isInHouse: true,
      },
      hasAjb: false,
    });

    const sudah: PencairanSudahDiajukan = {
      closingNominal: 0,
      marketingNominal: IN_HOUSE_MARKETING / 2,
      tahaps: ["PPJB"],
    };

    const preview = getPencairanPreview(ctx, sudah);
    const marketing = preview.komponen.find((k) => k.key === "marketing")!;

    expect(marketing.eligible).toBe(false);
    expect(marketing.alasan).toBe("Upload salinan AJB (sisa 50%)");
    expect(hasAnyEligiblePencairan(ctx, sudah)).toBe(false);
  });

  it("in-house KPR: boleh cair penuh dengan PPJB tanpa file AJB", () => {
    const ctx = baseCtx({
      caraPembayaran: "KPR",
      agent: {
        feeMarketingPct: 5,
        feeClosingNominal: 0,
        potonganPph: 0,
        isPkp: false,
        isInHouse: true,
      },
      hasSp3k: true,
      hasAjb: false,
      hasAkadKredit: true,
    });

    const preview = getPencairanPreview(ctx, emptySudah);
    const marketing = preview.komponen.find((k) => k.key === "marketing")!;

    expect(marketing.eligible).toBe(true);
    expect(marketing.nominalSisa).toBe(IN_HOUSE_MARKETING);

    const submit = calcPencairanSubmit(ctx, emptySudah, ["marketing"]);
    expect(submit.tahap).toBe("AJB");
    expect(submit.marketingNominal).toBe(IN_HOUSE_MARKETING);
  });
});

describe("agentPencairanCalc — existing flow agent eksternal tetap utuh", () => {
  it("agent eksternal cash: closing + marketing PPJB tanpa AJB", () => {
    const ctx = baseCtx({
      agent: {
        feeMarketingPct: 5,
        feeClosingNominal: 1_500_000,
        potonganPph: 2.5,
        isPkp: false,
        isInHouse: false,
      },
      hasAjb: false,
    });

    const preview = getPencairanPreview(ctx, emptySudah);
    const closing = preview.komponen.find((k) => k.key === "closing")!;
    const marketing = preview.komponen.find((k) => k.key === "marketing")!;

    expect(closing.eligible).toBe(true);
    expect(marketing.eligible).toBe(true);
    expect(marketing.nominalSisa).toBe(NILAI_AJB * 0.05);
  });

  it("agent eksternal KPR: marketing penuh dengan PPJB tanpa file AJB", () => {
    const ctx = baseCtx({
      caraPembayaran: "KPR",
      agent: {
        feeMarketingPct: 5,
        feeClosingNominal: 1_500_000,
        potonganPph: 2.5,
        isPkp: false,
        isInHouse: false,
      },
      hasSp3k: true,
      hasAjb: false,
      hasAkadKredit: true,
    });

    const preview = getPencairanPreview(ctx, emptySudah);
    const closing = preview.komponen.find((k) => k.key === "closing")!;
    const marketing = preview.komponen.find((k) => k.key === "marketing")!;

    expect(closing.eligible).toBe(true);
    expect(marketing.eligible).toBe(true);
    expect(marketing.nominalSisa).toBe(NILAI_AJB * 0.05);
  });

  it("agent eksternal cash: marketing AJB tahap ditolak tanpa file AJB", () => {
    const ctx = baseCtx({ hasAjb: false });
    const sudah: PencairanSudahDiajukan = {
      closingNominal: 0,
      marketingNominal: (NILAI_AJB * 0.05) / 2,
      tahaps: ["PPJB"],
    };

    const marketing = getPencairanPreview(ctx, sudah).komponen.find(
      (k) => k.key === "marketing",
    )!;

    expect(marketing.eligible).toBe(false);
    expect(marketing.alasan).toBe("Upload salinan AJB (sisa 50%)");
  });
});
