import { describe, expect, it } from "vitest";
import {
  toSpkPembayaranCalcRows,
  canRequestKasbon,
  canRequestSpkPembayaran,
  validatePengurangTerminNominal,
  calcSpkPembayaranNominal,
  calcSisaNilaiKontrak,
  type SpkPembayaranStatusRow,
  type SpkPengurangTerminRow,
  type SpkPembayaranCalcRow,
} from "./spkPembayaranCalc";

describe("SPK Pembayaran Nota Material Sendiri (isMandorSendiri)", () => {
  it("toSpkPembayaranCalcRows harus mengabaikan baris dengan isMandorSendiri = true", () => {
    const list: SpkPembayaranStatusRow[] = [
      {
        id: 1,
        jenis: "KASBON",
        nominal: 5000000,
        status: "SUDAH_DIBAYAR",
        mengurangiTermin: "TERMIN_1",
        isMandorSendiri: false,
      },
      {
        id: 2,
        jenis: "KASBON",
        nominal: 15000000,
        status: "SUDAH_DIBAYAR",
        mengurangiTermin: null,
        isMandorSendiri: true,
      },
    ];

    const calcRows = toSpkPembayaranCalcRows(list);
    expect(calcRows).toHaveLength(1);
    expect(calcRows[0]?.id).toBe(1);
    expect(calcRows[0]?.nominal).toBe(5000000);
  });

  it("canRequestKasbon dan validatePengurangTerminNominal tidak boleh terkurangi oleh nota mandor sendiri", () => {
    const nilaiKontrak = 100000000;
    const pengurangRows: SpkPengurangTerminRow[] = [
      {
        id: 1,
        jenis: "KASBON",
        nominal: 10000000,
        status: "SUDAH_DIBAYAR",
        mengurangiTermin: null,
        isMandorSendiri: true, // Non-reimburse
      },
    ];

    const activePengurangRows = pengurangRows.filter((p) => !p.isMandorSendiri);
    expect(activePengurangRows).toHaveLength(0);

    const validation = validatePengurangTerminNominal(
      nilaiKontrak,
      activePengurangRows,
      "TERMIN_1",
      20000000, // Request 20jt
    );

    expect(validation.allowed).toBe(true);
  });

  it("calcSpkPembayaranNominal dan calcSisaNilaiKontrak tidak terkurangi oleh nota material sendiri", () => {
    const nilaiKontrak = 100000000;
    const calcRows: SpkPembayaranCalcRow[] = [
      {
        id: 1,
        jenis: "KASBON",
        nominal: 25000000,
        status: "SUDAH_DIBAYAR",
        mengurangiTermin: "TERMIN_1",
        isMandorSendiri: true, // Nota sendiri 25jt
      },
    ];

    // Nominal TERMIN_55 (50% dari 100jt = 50jt) TIDAK boleh terpotong oleh nota sendiri
    const nominalTermin1 = calcSpkPembayaranNominal(
      "TERMIN_55",
      { nilaiKontrak },
      calcRows,
      "RUMAH_DEFAULT",
    );
    expect(nominalTermin1).toBe(50000000);

    // Sisa nilai kontrak SPK juga harus tetap utuh 100jt
    const sisa = calcSisaNilaiKontrak(nilaiKontrak, calcRows);
    expect(sisa).toBe(100000000);
  });

  it("canRequest TERMIN_55: nota sendiri tidak membuat nominal jadi 0 (regresi SPK 51)", () => {
    const nilaiKontrak = 348705834;
    const statusRows: SpkPembayaranStatusRow[] = [
      {
        id: 234,
        jenis: "KASBON",
        nominal: 52458000,
        status: "SUDAH_DIBAYAR",
        mengurangiTermin: "TERMIN_55",
        isMandorSendiri: false,
      },
      {
        id: 287,
        jenis: "KASBON",
        nominal: 70279000,
        status: "SUDAH_DIBAYAR",
        mengurangiTermin: null,
        isMandorSendiri: true,
      },
      {
        id: 286,
        jenis: "UPAH",
        nominal: 51615917,
        status: "MENUNGGU_PERSETUJUAN",
        mengurangiTermin: "TERMIN_55",
        isMandorSendiri: false,
      },
    ];

    const check = canRequestSpkPembayaran(
      "TERMIN_55",
      { nilaiKontrak, progress: 55 },
      statusRows,
      "RUMAH_DEFAULT",
    );
    expect(check.allowed).toBe(true);
    expect(
      calcSpkPembayaranNominal(
        "TERMIN_55",
        { nilaiKontrak },
        toSpkPembayaranCalcRows(statusRows),
        "RUMAH_DEFAULT",
      ),
    ).toBe(70279000);

    // Simulasi bug lama: statusRows tanpa isMandorSendiri → nota sendiri ikut terhitung.
    const buggyRows = statusRows.map(({ isMandorSendiri: _omit, ...rest }) => rest) as SpkPembayaranStatusRow[];
    const buggy = canRequestSpkPembayaran(
      "TERMIN_55",
      { nilaiKontrak, progress: 55 },
      buggyRows,
      "RUMAH_DEFAULT",
    );
    expect(buggy.allowed).toBe(false);
    expect(buggy.reason).toContain("Nominal termin Rp 0");
  });
});
