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
