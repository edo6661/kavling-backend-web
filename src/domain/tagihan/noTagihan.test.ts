import { describe, expect, it } from "vitest";
import {
  buildDpNoTagihan,
  getNextDpSequence,
  parseDpSequenceFromPembayaran,
  resolveDpNoTagihanForCreate,
} from "./noTagihan.js";

describe("noTagihan DP cicilan", () => {
  const trx = "TRX-AA27-6-96";

  it("mem-parse urutan dari deskripsi DP Ke-N", () => {
    expect(parseDpSequenceFromPembayaran("DP Ke-2")).toBe(2);
    expect(parseDpSequenceFromPembayaran("DP Cicilan Ke-3")).toBe(3);
    expect(parseDpSequenceFromPembayaran("Cicilan DP ke-4")).toBe(4);
    expect(parseDpSequenceFromPembayaran("Down Payment (DP)")).toBeNull();
  });

  it("cicilan pertama tanpa suffix, berikutnya bernomor", () => {
    expect(buildDpNoTagihan(trx, 1)).toBe(`INV-DP-${trx}`);
    expect(buildDpNoTagihan(trx, 2)).toBe(`INV-DP-${trx}-2`);
  });

  it("menghitung urutan berikutnya setelah tagihan pertama", () => {
    expect(getNextDpSequence([`INV-DP-${trx}`], trx)).toBe(2);
    expect(
      getNextDpSequence([`INV-DP-${trx}`, `INV-DP-${trx}-2`], trx),
    ).toBe(3);
    expect(getNextDpSequence([], trx)).toBe(1);
  });

  it("auto-generate nomor kedua jika yang pertama sudah ada", () => {
    expect(
      resolveDpNoTagihanForCreate({
        noTransaksi: trx,
        pembayaran: "Down Payment (DP)",
        existingDpNoTagihans: [`INV-DP-${trx}`],
      }),
    ).toBe(`INV-DP-${trx}-2`);
  });
});
