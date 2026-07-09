import { describe, expect, it, vi } from "vitest";
import { LunaskanBookingFeeUseCase } from "./LunaskanBookingFeeUseCase.js";
import { ConflictError } from "../../../domain/errors/ConflictError.js";

describe("LunaskanBookingFeeUseCase", () => {
  it("returns idempotent result when booking fee already lunas", async () => {
    const approve = vi.fn();
    const db = {
      penjualan: {
        findUnique: vi.fn().mockResolvedValue({
          id: 1,
          noTransaksi: "TRX-001",
          status: "BOOKED",
          bookingFee: 5_000_000,
          customerId: 10,
          tanggal: new Date("2026-01-01"),
          tagihan: [
            {
              id: 99,
              noTagihan: "INV-BF-TRX-001",
              pembayaran: "Booking Fee",
              tujuan: "BOOKING_FEE",
              status: "LUNAS",
            },
          ],
        }),
      },
      tagihan: { create: vi.fn() },
    };

    const useCase = new LunaskanBookingFeeUseCase(db as never, {
      execute: approve,
    } as never);

    const result = await useCase.execute("TRX-001");

    expect(result.alreadyLunas).toBe(true);
    expect(approve).not.toHaveBeenCalled();
  });

  it("creates missing booking fee tagihan then approves", async () => {
    const approve = vi.fn().mockResolvedValue({ id: 100, status: "LUNAS" });
    const db = {
      penjualan: {
        findUnique: vi.fn().mockResolvedValue({
          id: 2,
          noTransaksi: "TRX-002",
          status: "PROSES",
          bookingFee: 3_000_000,
          customerId: 11,
          tanggal: new Date("2026-02-01"),
          tagihan: [],
        }),
      },
      tagihan: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({
          id: 100,
          noTagihan: "INV-BF-TRX-002",
          pembayaran: "Booking Fee",
          tujuan: "BOOKING_FEE",
          status: "BELUM_BAYAR",
        }),
      },
    };

    const useCase = new LunaskanBookingFeeUseCase(db as never, {
      execute: approve,
    } as never);

    const result = await useCase.execute("TRX-002");

    expect(db.tagihan.create).toHaveBeenCalledOnce();
    expect(approve).toHaveBeenCalledWith(100, true);
    expect(result.alreadyLunas).toBe(false);
  });

  it("rejects batal penjualan", async () => {
    const useCase = new LunaskanBookingFeeUseCase(
      {
        penjualan: {
          findUnique: vi.fn().mockResolvedValue({
            id: 3,
            status: "BATAL",
            tagihan: [],
          }),
        },
      } as never,
      { execute: vi.fn() } as never,
    );

    await expect(useCase.execute("TRX-BATAL")).rejects.toBeInstanceOf(
      ConflictError,
    );
  });
});
