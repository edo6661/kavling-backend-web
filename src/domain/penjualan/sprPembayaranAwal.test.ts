import { describe, it, expect } from "vitest";
import {
  buildSprPembayaranAwalRows,
  resolveEffectiveDpForSpr,
} from "./sprPembayaranAwal.js";

const basePenjualan = {
  tanggal: new Date("2026-05-01"),
  bookingFee: 5_000_000,
  caraPembayaran: "KPR" as const,
};

describe("resolveEffectiveDpForSpr", () => {
  it("memprioritaskan dpDibayar jika ada nilainya", () => {
    expect(
      resolveEffectiveDpForSpr({
        dpDibayar: 50_000_000,
        dpTidakDibayar: 40_000_000,
        dp: 40_000_000,
      }),
    ).toBe(50_000_000);
  });

  it("memakai dpTidakDibayar jika dpDibayar kosong atau 0", () => {
    expect(
      resolveEffectiveDpForSpr({
        dpDibayar: 0,
        dpTidakDibayar: 40_000_000,
        dp: 35_000_000,
      }),
    ).toBe(40_000_000);
  });

  it("fallback ke kolom dp jika dpDibayar dan dpTidakDibayar kosong", () => {
    expect(
      resolveEffectiveDpForSpr({
        dpDibayar: null,
        dpTidakDibayar: null,
        dp: 35_000_000,
      }),
    ).toBe(35_000_000);
  });
});

describe("buildSprPembayaranAwalRows", () => {
  it("menyertakan booking fee dan DP untuk KPR dari field penjualan", () => {
    const rows = buildSprPembayaranAwalRows({
      ...basePenjualan,
      dpDibayar: null,
      dpTidakDibayar: 45_000_000,
      dp: 45_000_000,
    });

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      keterangan: "Booking Fee",
      nominal: 5_000_000,
    });
    expect(rows[1]).toMatchObject({
      keterangan: "Down Payment (DP)",
      nominal: 45_000_000,
    });
  });

  it("memakai dpDibayar di SPR jika diinput", () => {
    const rows = buildSprPembayaranAwalRows({
      ...basePenjualan,
      dpDibayar: 55_000_000,
      dpTidakDibayar: 45_000_000,
      dp: 45_000_000,
    });

    expect(rows[1]?.nominal).toBe(55_000_000);
  });

  it("menyertakan DP untuk cash bertahap dari kolom dp", () => {
    const rows = buildSprPembayaranAwalRows({
      tanggal: new Date("2026-05-01"),
      bookingFee: 3_000_000,
      caraPembayaran: "CASH_BERTAHAP",
      dp: 30_000_000,
      dpDibayar: null,
      dpTidakDibayar: null,
    });

    expect(rows).toHaveLength(2);
    expect(rows[1]?.nominal).toBe(30_000_000);
  });

  it("tidak menyertakan DP untuk cash keras", () => {
    const rows = buildSprPembayaranAwalRows({
      ...basePenjualan,
      caraPembayaran: "CASH_KERAS",
      dp: 10_000_000,
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]?.keterangan).toBe("Booking Fee");
  });

  it("mengembalikan array kosong jika booking fee dan DP nol", () => {
    const rows = buildSprPembayaranAwalRows({
      tanggal: new Date("2026-05-01"),
      bookingFee: 0,
      caraPembayaran: "KPR",
      dp: 0,
      dpDibayar: 0,
      dpTidakDibayar: 0,
    });

    expect(rows).toHaveLength(0);
  });
});
