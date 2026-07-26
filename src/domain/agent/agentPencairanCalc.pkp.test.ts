import { describe, expect, it } from "vitest";
import {
  calcPencairanSubmit,
  getClosingFeeAmount,
  getPencairanPreview,
  type AgentPencairanCalcContext,
  type PencairanSudahDiajukan,
} from "./agentPencairanCalc.js";
import { extractClosingDpp, extractClosingPpn } from "./agentPkpTax.js";

const emptySudah: PencairanSudahDiajukan = {
  closingNominal: 0,
  marketingNominal: 0,
  tahaps: [],
};

/** Contoh Pak Arga (Weltown PKP): bruto closing 1.500.000 */
const BRUTO_CLOSING = 1_500_000;
const DPP = 1_351_351;
const PPN = 148_649;
const PPH23 = 27_027;
const TOTAL_TF = 1_472_973;

function pkpCtx(
  overrides: Partial<AgentPencairanCalcContext> = {},
): AgentPencairanCalcContext {
  return {
    penjualanStatus: "AKTIF",
    bookingFeeLunasBatal: false,
    caraPembayaran: "CASH_KERAS",
    hargaJual: 406_000_000,
    agent: {
      feeMarketingPct: 0,
      feeClosingNominal: BRUTO_CLOSING,
      potonganPph: 2,
      isPkp: true,
      isInHouse: false,
    },
    feeAgent: { closingNominal: null },
    nilaiAjb: 332_800_000,
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

describe("agentPkpTax — extract DPP/PPN", () => {
  it("split bruto closing sesuai angka Pak Arga", () => {
    expect(extractClosingDpp(BRUTO_CLOSING, true)).toBe(DPP);
    expect(extractClosingPpn(BRUTO_CLOSING, true)).toBe(PPN);
    expect(DPP + PPN).toBe(BRUTO_CLOSING);
  });
});

describe("agentPencairanCalc — agen PKP: PPN ikut di total transfer", () => {
  it("closing DPP dipakai untuk dasar PPh, PPN tidak masuk dasar PPh", () => {
    const ctx = pkpCtx();
    const preview = getPencairanPreview(ctx, emptySudah);
    const closing = preview.komponen.find((k) => k.key === "closing")!;

    expect(closing.nominalPenuh).toBe(DPP);
    expect(preview.totalFeeReferensi).toBe(DPP);
    expect(preview.potonganPph).toBe(PPH23);
  });

  it("total transfer = DPP + PPN − PPh 23 (bukan DPP − PPh saja)", () => {
    const ctx = pkpCtx();
    const submit = calcPencairanSubmit(ctx, emptySudah, ["closing"]);

    expect(submit.closingNominal).toBe(DPP);
    expect(submit.potonganPph).toBe(PPH23);
    expect(submit.totalNominal).toBe(TOTAL_TF);
    // Guard regress: formula lama DPP − PPh
    expect(submit.totalNominal).not.toBe(DPP - PPH23);
  });

  it("getClosingFeeAmount PKP mengembalikan DPP", () => {
    expect(
      getClosingFeeAmount(true, null, BRUTO_CLOSING, true, false),
    ).toBe(DPP);
  });
});

describe("agentPencairanCalc — PPh proporsional per pengajuan (cash)", () => {
  it("50% PPJB: PPh = rate × (closing + marketing tahap), bukan fee penuh", () => {
    // Kasus atasan: closing 1.500.000 + marketing 6.340.000, non-PKP 2%
    const closing = 1_500_000;
    const marketingFull = 12_680_000;
    const marketingPpjb = marketingFull / 2; // 6.340.000
    const nilaiAjb = 634_000_000; // 2% fee → 12.680.000

    const ctx: AgentPencairanCalcContext = {
      penjualanStatus: "AKTIF",
      bookingFeeLunasBatal: false,
      caraPembayaran: "CASH_KERAS",
      hargaJual: 700_000_000,
      agent: {
        feeMarketingPct: 2,
        feeClosingNominal: closing,
        potonganPph: 2,
        isPkp: false,
        isInHouse: false,
      },
      feeAgent: { closingNominal: null },
      nilaiAjb,
      tagihanList: [
        { tujuan: "BOOKING_FEE", pembayaran: "CASH", status: "LUNAS" },
      ],
      hasPpjb: true,
      hasSp3k: false,
      hasAjb: false,
      hasAkadKredit: true,
    };

    const submit = calcPencairanSubmit(ctx, emptySudah, [
      "closing",
      "marketing",
    ]);

    expect(submit.tahap).toBe("PPJB");
    expect(submit.closingNominal).toBe(closing);
    expect(submit.marketingNominal).toBe(marketingPpjb);

    const expectedPph = Math.round((closing + marketingPpjb) * 0.02); // 156.800
    expect(submit.potonganPph).toBe(expectedPph);
    expect(submit.potonganPph).toBe(156_800);
    // Guard regress: jangan borong PPh dari fee penuh (283.600)
    expect(submit.potonganPph).not.toBe(
      Math.round((closing + marketingFull) * 0.02),
    );
    expect(submit.totalNominal).toBe(closing + marketingPpjb - expectedPph); // 7.683.200
    expect(submit.totalNominal).toBe(7_683_200);
  });

  it("non-PKP 2,5%: PPh proporsional pada tahap PPJB", () => {
    const closing = 1_500_000;
    const marketingFull = 12_680_000;
    const marketingPpjb = marketingFull / 2;
    const nilaiAjb = 634_000_000;

    const ctx: AgentPencairanCalcContext = {
      penjualanStatus: "AKTIF",
      bookingFeeLunasBatal: false,
      caraPembayaran: "CASH_KERAS",
      hargaJual: 700_000_000,
      agent: {
        feeMarketingPct: 2,
        feeClosingNominal: closing,
        potonganPph: 2.5,
        isPkp: false,
        isInHouse: false,
      },
      feeAgent: { closingNominal: null },
      nilaiAjb,
      tagihanList: [
        { tujuan: "BOOKING_FEE", pembayaran: "CASH", status: "LUNAS" },
      ],
      hasPpjb: true,
      hasSp3k: false,
      hasAjb: false,
      hasAkadKredit: true,
    };

    const submit = calcPencairanSubmit(ctx, emptySudah, [
      "closing",
      "marketing",
    ]);

    expect(submit.potonganPph).toBe(
      Math.round((closing + marketingPpjb) * 0.025),
    ); // 196.000
    expect(submit.totalNominal).toBe(7_644_000);
  });

  it("KPR: marketing cair sekaligus, PPh tetap rate × nominal yang cair", () => {
    // Skenario alternatif: marketing penuh 6.340.000 dicairkan sekaligus
    const closing = 1_500_000;
    const marketingFull = 6_340_000;
    const nilaiAjb = 317_000_000; // 2% fee → 6.340.000

    const ctx: AgentPencairanCalcContext = {
      penjualanStatus: "AKTIF",
      bookingFeeLunasBatal: false,
      caraPembayaran: "KPR",
      hargaJual: 400_000_000,
      agent: {
        feeMarketingPct: 2,
        feeClosingNominal: closing,
        potonganPph: 2,
        isPkp: false,
        isInHouse: false,
      },
      feeAgent: { closingNominal: null },
      nilaiAjb,
      tagihanList: [
        { tujuan: "BOOKING_FEE", pembayaran: "CASH", status: "LUNAS" },
      ],
      hasPpjb: true,
      hasSp3k: true,
      hasAjb: false,
      hasAkadKredit: true,
    };

    const submit = calcPencairanSubmit(ctx, emptySudah, [
      "closing",
      "marketing",
    ]);

    expect(submit.closingNominal).toBe(closing);
    expect(submit.marketingNominal).toBe(marketingFull);
    expect(submit.potonganPph).toBe(156_800); // 2% × 7.840.000
    expect(submit.totalNominal).toBe(7_683_200);
  });

  it("tahap AJB memotong PPh hanya dari sisa marketing", () => {
    const closing = 1_500_000;
    const marketingFull = 12_680_000;
    const half = marketingFull / 2;
    const nilaiAjb = 634_000_000;

    const ctx: AgentPencairanCalcContext = {
      penjualanStatus: "AKTIF",
      bookingFeeLunasBatal: false,
      caraPembayaran: "CASH_KERAS",
      hargaJual: 700_000_000,
      agent: {
        feeMarketingPct: 2,
        feeClosingNominal: closing,
        potonganPph: 2,
        isPkp: false,
        isInHouse: false,
      },
      feeAgent: { closingNominal: null },
      nilaiAjb,
      tagihanList: [
        { tujuan: "BOOKING_FEE", pembayaran: "CASH", status: "LUNAS" },
      ],
      hasPpjb: true,
      hasSp3k: false,
      hasAjb: true,
      hasAkadKredit: true,
    };

    const sudah: PencairanSudahDiajukan = {
      closingNominal: closing,
      marketingNominal: half,
      tahaps: ["PPJB"],
    };

    const submit = calcPencairanSubmit(
      ctx,
      sudah,
      ["marketing"],
      [
        {
          id: 1,
          tahap: "PPJB",
          status: "SUDAH_DIBAYAR",
          closingNominal: closing,
          marketingNominal: half,
          potonganPph: 156_800,
        },
      ],
    );

    expect(submit.tahap).toBe("AJB");
    expect(submit.marketingNominal).toBe(half);
    expect(submit.potonganPph).toBe(Math.round(half * 0.02)); // 126.800
    expect(submit.totalNominal).toBe(half - 126_800);
  });
});
