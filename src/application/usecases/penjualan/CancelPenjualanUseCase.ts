import type { PrismaClient } from "@prisma/client";
import { NotFoundError } from "../../../domain/errors/NotFoundError.js";
import { AppError } from "../../../domain/errors/AppError.js";
import { StatusCodes } from "http-status-codes";

export class CancelPenjualanUseCase {
  constructor(private readonly db: PrismaClient) {}

  async execute(noTransaksi: string, alasanBatal: string) {
    return await this.db.$transaction(async (tx) => {
      const penjualan = await tx.penjualan.findUnique({
        where: { noTransaksi },
        include: { kavling: true },
      });

      if (!penjualan) throw new NotFoundError("Data Penjualan tidak ditemukan");

      if (penjualan.status !== "BOOKED" && penjualan.status !== "PROSES") {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          "Hanya penjualan berstatus BOOKED atau PROSES yang dapat dibatalkan.",
        );
      }
      // 1. Update Penjualan jadi BATAL
      const updatedPenjualan = await tx.penjualan.update({
        where: { id: penjualan.id },
        data: {
          status: "BATAL",
          alasanBatal: alasanBatal,
        },
      });

      // 2. Kembalikan Kavling jadi AVAILABLE
      await tx.kavling.update({
        where: { id: penjualan.kavlingId },
        data: { status: "AVAILABLE" },
      });

      return updatedPenjualan;
    });
  }
}
