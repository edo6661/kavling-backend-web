import { describe, expect, it } from "vitest";
import {
  buildPenjualanBulanDrilldownFilter,
  buildPenjualanByCaraTahunIni,
  parsePenjualanBulanFilter,
} from "./dashboardPenjualanBulan.js";

describe("parsePenjualanBulanFilter", () => {
  it("parses valid KPR filter", () => {
    expect(parsePenjualanBulanFilter("PENJUALAN_BULAN:2026:6:KPR")).toEqual({
      year: 2026,
      month: 6,
      caraPembayaran: "KPR",
    });
  });

  it("parses cash bertahap and cash keras", () => {
    expect(parsePenjualanBulanFilter("PENJUALAN_BULAN:2026:12:CASH_BERTAHAP")).toEqual({
      year: 2026,
      month: 12,
      caraPembayaran: "CASH_BERTAHAP",
    });
    expect(parsePenjualanBulanFilter("PENJUALAN_BULAN:2026:1:CASH_KERAS")).toEqual({
      year: 2026,
      month: 1,
      caraPembayaran: "CASH_KERAS",
    });
  });

  it("parses SEMUA filter", () => {
    expect(parsePenjualanBulanFilter("PENJUALAN_BULAN:2026:6:SEMUA")).toEqual({
      year: 2026,
      month: 6,
      caraPembayaran: "SEMUA",
    });
  });

  it("rejects invalid filters", () => {
    expect(parsePenjualanBulanFilter("KPR")).toBeNull();
    expect(parsePenjualanBulanFilter("PENJUALAN_BULAN:2026:13:KPR")).toBeNull();
    expect(parsePenjualanBulanFilter("PENJUALAN_BULAN:2026:6:INVALID")).toBeNull();
    expect(parsePenjualanBulanFilter(undefined)).toBeNull();
  });
});

describe("buildPenjualanBulanDrilldownFilter", () => {
  it("matches parser output", () => {
    const filter = buildPenjualanBulanDrilldownFilter(2026, 6, "KPR");
    expect(filter).toBe("PENJUALAN_BULAN:2026:6:KPR");
    expect(parsePenjualanBulanFilter(filter)).toEqual({
      year: 2026,
      month: 6,
      caraPembayaran: "KPR",
    });
  });
});

describe("buildPenjualanByCaraTahunIni", () => {
  it("groups penjualan by month and cara pembayaran", () => {
    const rows = buildPenjualanByCaraTahunIni(2026, [
      {
        hargaJual: 100_000_000,
        createdAt: new Date(2026, 5, 10),
        caraPembayaran: "KPR",
      },
      {
        hargaJual: 80_000_000,
        createdAt: new Date(2026, 5, 15),
        caraPembayaran: "CASH_BERTAHAP",
      },
      {
        hargaJual: 90_000_000,
        createdAt: new Date(2026, 5, 20),
        caraPembayaran: "KPR",
      },
      {
        hargaJual: 70_000_000,
        createdAt: new Date(2026, 6, 1),
        caraPembayaran: "CASH_KERAS",
      },
    ]);

    expect(rows.kpr[5]).toEqual({
      month: 6,
      monthLabel: "Juni",
      total: 190_000_000,
      count: 2,
    });
    expect(rows.cashBertahap[5]).toEqual({
      month: 6,
      monthLabel: "Juni",
      total: 80_000_000,
      count: 1,
    });
    expect(rows.cashKeras[5]?.count).toBe(0);
    expect(rows.cashKeras[6]).toEqual({
      month: 7,
      monthLabel: "Juli",
      total: 70_000_000,
      count: 1,
    });
  });
});
