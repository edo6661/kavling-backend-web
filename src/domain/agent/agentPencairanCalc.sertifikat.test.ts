import { describe, expect, it } from "vitest";
import {
  hasAjbComplete,
  hasPpjbComplete,
  resolveNilaiAjbTotal,
} from "./agentPencairanCalc.js";

describe("agentPencairanCalc — multi sertifikat", () => {
  it("resolveNilaiAjbTotal menjumlahkan tanah ke-1 dan tambahan", () => {
    const total = resolveNilaiAjbTotal({
      nilaiAjb: 300_000_000,
      sertifikatTambahan: [{ urutan: 2, nilaiAjb: 200_000_000 }],
    });
    expect(total).toBe(500_000_000);
  });

  it("hasPpjbComplete cukup PPJB urutan 1 (multi sertifikat tetap 1 PPJB)", () => {
    expect(
      hasPpjbComplete(
        {
          filePpjb: "a.pdf",
          sertifikatTambahan: [{ urutan: 2, filePpjb: null }],
        },
        2,
      ),
    ).toBe(true);

    expect(
      hasPpjbComplete(
        {
          filePpjb: null,
          sertifikatTambahan: [{ urutan: 2, filePpjb: "b.pdf" }],
        },
        2,
      ),
    ).toBe(false);
  });

  it("hasAjbComplete butuh semua tanah lengkap", () => {
    expect(
      hasAjbComplete(
        {
          fileAjb: "a.pdf",
          sertifikatTambahan: [{ urutan: 2, fileAjb: "b.pdf" }],
        },
        2,
      ),
    ).toBe(true);
  });
});
