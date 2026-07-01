import { describe, expect, it } from "vitest";
import { mapPenjualanToDrilldownItem } from "./penjualanDrilldownMapper.js";

function buildPenjualanRow(overrides: Record<string, unknown> = {}) {
  return {
    noTransaksi: "TRX-202606-001",
    hargaJual: 393_000_000,
    status: "PROSES",
    caraPembayaran: "KPR",
    createdAt: new Date("2026-06-10T08:30:00.000Z"),
    customer: { nama: "Mei Trihastuti" },
    kavling: { blok: "RK3", nomorUnit: "12" },
    agent: { nama: "Wiwi" },
    tagihan: [
      {
        status: "LUNAS",
        jatuhTempo: new Date("2026-06-12T00:00:00.000Z"),
      },
    ],
    ...overrides,
  };
}

describe("mapPenjualanToDrilldownItem", () => {
  it("maps booking date, booking fee payment date, and agent", () => {
    const item = mapPenjualanToDrilldownItem(buildPenjualanRow() as never);

    expect(item.label).toBe("Mei Trihastuti");
    expect(item.sublabel).toBe("Blok RK3 - 12");
    expect(item.tanggalBooking).toBe("2026-06-10");
    expect(item.tanggalBayarBookingFee).toBe("2026-06-12");
    expect(item.bookingFeeLunas).toBe(true);
    expect(item.agentNama).toBe("Wiwi");
    expect(item.caraPembayaranLabel).toBe("KPR");
  });

  it("marks booking fee as belum lunas when tagihan not paid", () => {
    const item = mapPenjualanToDrilldownItem(
      buildPenjualanRow({
        tagihan: [{ status: "BELUM_BAYAR", jatuhTempo: new Date("2026-06-12") }],
      }) as never,
    );

    expect(item.tanggalBayarBookingFee).toBeUndefined();
    expect(item.bookingFeeLunas).toBe(false);
  });
});
