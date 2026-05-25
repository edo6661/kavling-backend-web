import { describe, it, expect } from "vitest";
import {
  extractKodeBillingFromText,
  isPdfLikelyScanned,
} from "./billingPphPdfUtils.js";

const FAIL_FORMAT = `
KEMENTERIAN KEUANGAN RI
DIREKTORAT JENDERAL PAJAK
: 1000000005394119
: BINTANG SAFANA GAJAH
KODE BILLING
041924081839773
: JALAN RAYA PABUARAN, CIKEAS UDIK, GUNUNG PUTRI, KAB.
BOGOR, JAWA BARAT 16966
MATA UANG :IDR
NOMINAL : 13.387.500,00
JUMLAH DETAIL :1
DETAIL BILLING:
KAP-KJS MASA PAJAK REF TAGIHAN NOP
411128-402 04042026
TOTAL
NOMINAL
320314000703727110 Rp13.387.500,00
Rp13.387.500,00
GUNAKAN KODE BILLING DI BAWAH INI
UNTUK MELAKUKAN PEMBAYARAN
KODE BILLING :041924081839773
MASA AKTIF : 05/05/2026 11:16:15
`.trim();

const OK_FORMAT = `
KEMENTERIAN KEUANGAN RI
DIREKTORAT JENDERAL PAJAK
K O D E B I L L I N G
042079769810908
NPWP : 1000000005394119
NAMA : BINTANG SAFANA GAJAH
GUNAKAN KODE BILLING DI BAWAH INI
KODE BILLING : 042079769810908
MASA AKTIF : 05/06/2026 12:42:53
`.trim();

describe("extractKodeBillingFromText", () => {
  it("mengekstrak kode dari format DJP lama (NPWP di atas)", () => {
    expect(extractKodeBillingFromText(FAIL_FORMAT)).toBe("041924081839773");
  });

  it("mengekstrak kode dari format DJP baru (huruf terpisah)", () => {
    expect(extractKodeBillingFromText(OK_FORMAT)).toBe("042079769810908");
  });

  it("mengekstrak saat KODE BILLING dan angka dipisah DETAIL BILLING (satu baris)", () => {
    const messy =
      "KODE BILLING DETAIL BILLING: KAP 041924081839773 GUNAKAN KODE BILLING DI BAWAH KODE BILLING :041924081839773";
    expect(extractKodeBillingFromText(messy)).toBe("041924081839773");
  });

  it("mengembalikan null jika tidak ada kode billing", () => {
    expect(extractKodeBillingFromText("KODE BILLING DETAIL BILLING tanpa angka")).toBeNull();
  });

  it("mendeteksi PDF scan (teks sangat sedikit)", () => {
    expect(isPdfLikelyScanned("")).toBe(true);
    expect(isPdfLikelyScanned("abc")).toBe(true);
  });

  it("tidak mendeteksi PDF teks asli sebagai scan", () => {
    expect(isPdfLikelyScanned(FAIL_FORMAT)).toBe(false);
  });
});
