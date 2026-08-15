import { describe, expect, it } from "vitest";
import {
  validateCustomTerminConfig,
  parseCustomTerminSteps,
  getSpkTerminScheme,
  type SpkCustomTerminStep,
} from "./spkTerminScheme.js";
import {
  calcSpkPembayaranNominal,
  canRequestSpkPembayaran,
  getPengurangTerminCapacity,
  toSpkPembayaranCalcRows,
  type SpkPembayaranStatusRow,
  type SpkPengurangTerminRow,
} from "./spkPembayaranCalc.js";

describe("SPK Custom Termin Scheme & Calculations", () => {
  const custom3Steps: SpkCustomTerminStep[] = [
    {
      urutan: 1,
      label: "Termin 1 (Pondasi)",
      kontrakFraction: 0.4,
      minProgress: 40,
    },
    {
      urutan: 2,
      label: "Termin 2 (Struktur)",
      kontrakFraction: 0.4,
      minProgress: 80,
    },
    {
      urutan: 3,
      label: "Termin 3 (Finishing & Serah Terima)",
      kontrakFraction: 0.2,
      minProgress: 100,
    },
  ];

  it("validateCustomTerminConfig harus menerima konfigurasi yang valid (total 100%)", () => {
    const res = validateCustomTerminConfig(custom3Steps);
    expect(res.valid).toBe(true);
  });

  it("validateCustomTerminConfig harus menolak jika total persentase bukan 100%", () => {
    const invalidSteps: SpkCustomTerminStep[] = [
      { urutan: 1, label: "T1", kontrakFraction: 0.3, minProgress: 30 },
      { urutan: 2, label: "T2", kontrakFraction: 0.3, minProgress: 60 },
    ];
    const res = validateCustomTerminConfig(invalidSteps);
    expect(res.valid).toBe(false);
    expect(res.message).toContain("100%");
  });

  it("validateCustomTerminConfig harus menolak jika minProgress tidak berurutan naik", () => {
    const invalidSteps: SpkCustomTerminStep[] = [
      { urutan: 1, label: "T1", kontrakFraction: 0.5, minProgress: 60 },
      { urutan: 2, label: "T2", kontrakFraction: 0.5, minProgress: 30 },
    ];
    const res = validateCustomTerminConfig(invalidSteps);
    expect(res.valid).toBe(false);
    expect(res.message).toContain("tidak boleh lebih kecil");
  });

  it("parseCustomTerminSteps harus memetakan step non-retensi ke generic custom keys dan retensi ke RETENSI", () => {
    const stepsWithRetensi: SpkCustomTerminStep[] = [
      { urutan: 1, label: "Termin 1", kontrakFraction: 0.45, minProgress: 50 },
      { urutan: 2, label: "Termin 2", kontrakFraction: 0.5, minProgress: 100 },
      { urutan: 3, label: "Retensi", kontrakFraction: 0.05, minProgress: 100, isRetensi: true },
    ];
    const parsed = parseCustomTerminSteps(stepsWithRetensi);
    expect(parsed).toHaveLength(3);
    expect(parsed[0]?.jenis).toBe("TERMIN_CUSTOM_1");
    expect(parsed[1]?.jenis).toBe("TERMIN_CUSTOM_2");
    expect(parsed[2]?.jenis).toBe("RETENSI");
  });

  it("getSpkTerminScheme dengan SPK custom harus mengembalikan step dinamis", () => {
    const spk = {
      jenis: "RUMAH" as const,
      terminScheme: "CUSTOM" as const,
      terminConfig: custom3Steps,
    };
    const scheme = getSpkTerminScheme(spk);
    expect(scheme).toHaveLength(3);
    expect(scheme[0]?.jenis).toBe("TERMIN_CUSTOM_1");
    expect(scheme[0]?.kontrakFraction).toBe(0.4);
    expect(scheme[1]?.jenis).toBe("TERMIN_CUSTOM_2");
    expect(scheme[1]?.kontrakFraction).toBe(0.4);
    expect(scheme[2]?.jenis).toBe("TERMIN_CUSTOM_3");
    expect(scheme[2]?.kontrakFraction).toBe(0.2);
  });

  it("Kalkulasi waterfall kasbon & upah harus memotong Termin 1 Custom hingga penuh lalu spillover", () => {
    const nilaiKontrak = 100_000_000;
    const spk = {
      jenis: "RUMAH" as const,
      terminScheme: "CUSTOM" as const,
      terminConfig: custom3Steps,
    };

    // Plafon Termin 1 = 40% x 100jt = 40jt
    // Plafon Termin 2 = 40% x 100jt = 40jt
    // Plafon Termin 3 = 20% x 100jt = 20jt

    const pengurangRows: SpkPengurangTerminRow[] = [
      { id: 1, jenis: "KASBON", nominal: 25_000_000, mengurangiTermin: "TERMIN_CUSTOM_1" },
    ];

    // Cek sisa kapasitas Termin 1
    const cap1 = getPengurangTerminCapacity(nilaiKontrak, pengurangRows, "TERMIN_CUSTOM_1", {
      terminScheme: spk,
    });
    expect(cap1.bruto).toBe(40_000_000);
    expect(cap1.terpakai).toBe(25_000_000);
    expect(cap1.sisa).toBe(15_000_000);

    // Hitung nominal netto Termin 1: Bruto 40jt - Kasbon 25jt = 15jt
    const calcRows = toSpkPembayaranCalcRows([
      { id: 1, jenis: "KASBON", nominal: 25_000_000, status: "SUDAH_DIBAYAR", isMandorSendiri: false },
    ]);
    const nominalT1 = calcSpkPembayaranNominal("TERMIN_CUSTOM_1", { nilaiKontrak }, calcRows, spk);
    expect(nominalT1).toBe(15_000_000);
  });

  it("canRequestSpkPembayaran memeriksa batas progress custom & termin prasyarat", () => {
    const nilaiKontrak = 100_000_000;
    const spkInput = {
      nilaiKontrak,
      progress: 30, // Belum mencapai minProgress Termin 1 (40%)
    };
    const spkScheme = {
      jenis: "RUMAH" as const,
      terminScheme: "CUSTOM" as const,
      terminConfig: custom3Steps,
    };

    const statusRows: SpkPembayaranStatusRow[] = [];

    // Belum capai 40% -> tolak
    const check1 = canRequestSpkPembayaran("TERMIN_CUSTOM_1", spkInput, statusRows, spkScheme);
    expect(check1.allowed).toBe(false);
    expect(check1.reason).toContain("minimal 40%");

    // Progress 50% -> boleh ajukan Termin 1
    const check2 = canRequestSpkPembayaran(
      "TERMIN_CUSTOM_1",
      { nilaiKontrak, progress: 50 },
      statusRows,
      spkScheme,
    );
    expect(check2.allowed).toBe(true);

    // Tidak boleh ajukan Termin 2 sebelum Termin 1 dibayar
    const check3 = canRequestSpkPembayaran(
      "TERMIN_CUSTOM_2",
      { nilaiKontrak, progress: 85 },
      statusRows,
      spkScheme,
    );
    expect(check3.allowed).toBe(false);
    expect(check3.reason).toContain("harus sudah dibayar finance");
  });
});
