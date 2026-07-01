import { describe, expect, it } from "vitest";
import {
  formatTukangPtkpStatus,
  normalizeTukangMaritalForSave,
} from "./tukangMarital.js";

describe("normalizeTukangMaritalForSave", () => {
  it("returns null when marital fields omitted (existing API compat)", () => {
    expect(normalizeTukangMaritalForSave({})).toBeNull();
  });

  it("normalizes belum menikah to jumlahAnak 0", () => {
    expect(normalizeTukangMaritalForSave({ sudahMenikah: false })).toEqual({
      sudahMenikah: false,
      jumlahAnak: 0,
    });
  });

  it("requires jumlah anak when sudah menikah", () => {
    expect(() =>
      normalizeTukangMaritalForSave({ sudahMenikah: true }),
    ).toThrow("TUKANG_JUMLAH_ANAK_REQUIRED");
  });

  it("accepts valid jumlah anak 0-3", () => {
    expect(
      normalizeTukangMaritalForSave({ sudahMenikah: true, jumlahAnak: 2 }),
    ).toEqual({ sudahMenikah: true, jumlahAnak: 2 });
  });

  it("rejects jumlah anak above 3", () => {
    expect(() =>
      normalizeTukangMaritalForSave({ sudahMenikah: true, jumlahAnak: 4 }),
    ).toThrow("TUKANG_JUMLAH_ANAK_INVALID");
  });
});

describe("formatTukangPtkpStatus", () => {
  it("returns null for legacy rows without marital data", () => {
    expect(formatTukangPtkpStatus(null, null)).toBeNull();
  });

  it("maps marital status to PTKP codes", () => {
    expect(formatTukangPtkpStatus(false, 0)).toBe("TK/0");
    expect(formatTukangPtkpStatus(true, 1)).toBe("K/1");
    expect(formatTukangPtkpStatus(true, 5)).toBe("K/3");
  });
});
