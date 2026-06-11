import { describe, expect, it } from "vitest";
import {
  extractNopdFromText,
  normalizeNopd,
} from "./pbbPdfUtils.js";

describe("normalizeNopd", () => {
  it("accepts formatted NOPD", () => {
    expect(normalizeNopd("32.03.140.007.037-2439.0")).toBe(
      "32.03.140.007.037-2439.0",
    );
  });

  it("rejects too short values", () => {
    expect(normalizeNopd("1234")).toBeNull();
  });
});

describe("extractNopdFromText", () => {
  it("extracts NOPD from labeled line", () => {
    const text = `
SURAT PEMBERITAHUAN PAJAK TERHUTANG
NOPD : 32.03.140.007.037-2439.0 TAHUN 2025
LETAK OBJEK PAJAK
`;
    expect(extractNopdFromText(text)).toBe("32.03.140.007.037-2439.0");
  });

  it("prefers repeated matching NOPD values", () => {
    const text = `
NOPD : 32.03.140.007.037-2439.0 TAHUN
...
NOPD : 32.03.140.007.037-2439.0
SPPT Tahun/Rp
`;
    expect(extractNopdFromText(text)).toBe("32.03.140.007.037-2439.0");
  });

  it("extracts NOPD on next line after label", () => {
    const text = `
NOPD
32.03.140.007.037-2780.0
SPPT Tahun/Rp Nama Terang
`;
    expect(extractNopdFromText(text)).toBe("32.03.140.007.037-2780.0");
  });

  it("returns null when no valid NOPD found", () => {
    expect(extractNopdFromText("NOPD TAHUN\nLETAK OBJEK PAJAK")).toBeNull();
  });
});
