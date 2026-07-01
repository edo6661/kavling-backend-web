import { describe, expect, it } from "vitest";
import {
  buildPenjualanPeriodeDrilldownFilter,
  parseDateRangeFromIso,
  parseIsoDateParts,
  parsePenjualanPeriodeFilter,
} from "./dashboardPenjualanPeriode.js";

describe("parseIsoDateParts", () => {
  it("parses valid ISO dates", () => {
    expect(parseIsoDateParts("2026-06-01")).toEqual({ year: 2026, month: 6, day: 1 });
    expect(parseIsoDateParts("2026-06-30")).toEqual({ year: 2026, month: 6, day: 30 });
  });

  it("rejects invalid dates", () => {
    expect(parseIsoDateParts("2026-13-01")).toBeNull();
    expect(parseIsoDateParts("2026-06-31")).toBeNull();
    expect(parseIsoDateParts("invalid")).toBeNull();
  });
});

describe("parseDateRangeFromIso", () => {
  it("builds inclusive local date range", () => {
    const range = parseDateRangeFromIso("2026-06-01", "2026-06-30");
    expect(range).not.toBeNull();
    expect(range!.start).toEqual(new Date(2026, 5, 1, 0, 0, 0, 0));
    expect(range!.end).toEqual(new Date(2026, 5, 30, 23, 59, 59, 999));
  });

  it("rejects inverted ranges", () => {
    expect(parseDateRangeFromIso("2026-06-30", "2026-06-01")).toBeNull();
  });
});

describe("parsePenjualanPeriodeFilter", () => {
  it("parses valid periode filter", () => {
    expect(
      parsePenjualanPeriodeFilter("PENJUALAN_PERIODE:2026-06-01:2026-06-30:KPR"),
    ).toEqual({
      dateFrom: "2026-06-01",
      dateTo: "2026-06-30",
      caraPembayaran: "KPR",
    });
  });

  it("rejects invalid filters", () => {
    expect(parsePenjualanPeriodeFilter("PENJUALAN_BULAN:2026:6:KPR")).toBeNull();
    expect(
      parsePenjualanPeriodeFilter("PENJUALAN_PERIODE:2026-06-30:2026-06-01:KPR"),
    ).toBeNull();
  });
});

describe("buildPenjualanPeriodeDrilldownFilter", () => {
  it("matches parser output", () => {
    const filter = buildPenjualanPeriodeDrilldownFilter(
      "2026-06-01",
      "2026-06-30",
      "SEMUA",
    );
    expect(filter).toBe("PENJUALAN_PERIODE:2026-06-01:2026-06-30:SEMUA");
    expect(parsePenjualanPeriodeFilter(filter)).toEqual({
      dateFrom: "2026-06-01",
      dateTo: "2026-06-30",
      caraPembayaran: "SEMUA",
    });
  });
});
