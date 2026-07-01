import { describe, expect, it } from "vitest";
import {
  calcBphtbFromNilaiAjb,
  calcPajakAllSlots,
  calcPajakFromNilaiAjb,
} from "./progressPenjualanSertifikatUtils.js";

describe("calcPajakFromNilaiAjb", () => {
  it("uses standard BPHTB formula for single sertifikat", () => {
    const result = calcPajakFromNilaiAjb(512_900_000);
    expect(result.biayaPph).toBe(12_822_500);
    expect(result.biayaBphtb).toBe(21_645_000);
  });

  it("applies multi-sertifikat BPHTB rules when all slots are provided", () => {
    const slots = [
      { urutan: 1, nilaiAjb: 72_500_000 },
      { urutan: 2, nilaiAjb: 512_900_000 },
    ];

    const small = calcPajakFromNilaiAjb(72_500_000, { urutan: 1, allSlots: slots });
    const large = calcPajakFromNilaiAjb(512_900_000, {
      urutan: 2,
      allSlots: slots,
    });

    expect(small.biayaPph).toBe(1_812_500);
    expect(small.biayaBphtb).toBe(3_625_000);
    expect(large.biayaPph).toBe(12_822_500);
    expect(large.biayaBphtb).toBe(21_645_000);
  });

  it("recalculates all slots consistently regardless of input order", () => {
    const slots = [
      { urutan: 1, nilaiAjb: 512_900_000 },
      { urutan: 2, nilaiAjb: 72_500_000 },
    ];
    const pajakMap = calcPajakAllSlots(slots);

    expect(pajakMap.get(1)?.biayaBphtb).toBe(21_645_000);
    expect(pajakMap.get(2)?.biayaBphtb).toBe(3_625_000);
  });

  it("uses standard formula until more than one nilai AJB is filled", () => {
    const slots = [{ urutan: 1, nilaiAjb: 72_500_000 }];
    expect(
      calcBphtbFromNilaiAjb(72_500_000, 1, slots),
    ).toBe(0);
  });

  it("keeps single-sertifikat calcPajakAllSlots identical to legacy formula", () => {
    const slots = [{ urutan: 1, nilaiAjb: 512_900_000 }];
    const legacy = calcPajakFromNilaiAjb(512_900_000);
    const fromAll = calcPajakAllSlots(slots).get(1);
    expect(fromAll).toEqual(legacy);
  });

  it("does not change PPh calculation for multi-sertifikat", () => {
    const slots = [
      { urutan: 1, nilaiAjb: 72_500_000 },
      { urutan: 2, nilaiAjb: 512_900_000 },
    ];
    const pajakMap = calcPajakAllSlots(slots);
    expect(pajakMap.get(1)?.biayaPph).toBe(72_500_000 * 0.025);
    expect(pajakMap.get(2)?.biayaPph).toBe(512_900_000 * 0.025);
  });

  it("uses standard formula when only one of two slots has nilai AJB (matches DB recalc)", () => {
    const slots = [
      { urutan: 1, nilaiAjb: 72_500_000 },
      { urutan: 2, nilaiAjb: 0 },
    ];
    const pajakMap = calcPajakAllSlots(slots);
    expect(pajakMap.get(1)?.biayaBphtb).toBe(0);
    expect(pajakMap.get(2)?.biayaBphtb).toBe(0);
  });

  it("picks lowest urutan when two slots have equal minimum nilai AJB", () => {
    const slots = [
      { urutan: 1, nilaiAjb: 100_000_000 },
      { urutan: 2, nilaiAjb: 100_000_000 },
    ];
    const pajakMap = calcPajakAllSlots(slots);
    expect(pajakMap.get(1)?.biayaBphtb).toBe(5_000_000);
    expect(pajakMap.get(2)?.biayaBphtb).toBe(1_000_000);
  });

  it("supports three or more sertifikat with one exempt minimum", () => {
    const slots = [
      { urutan: 1, nilaiAjb: 50_000_000 },
      { urutan: 2, nilaiAjb: 200_000_000 },
      { urutan: 3, nilaiAjb: 300_000_000 },
    ];
    const pajakMap = calcPajakAllSlots(slots);
    expect(pajakMap.get(1)?.biayaBphtb).toBe(2_500_000);
    expect(pajakMap.get(2)?.biayaBphtb).toBe(6_000_000);
    expect(pajakMap.get(3)?.biayaBphtb).toBe(11_000_000);
  });
});
