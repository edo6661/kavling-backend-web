import type { PrismaClient } from "@prisma/client";
import { NotFoundError } from "../../../domain/errors/NotFoundError.js";
export class CancelPenjualanUseCase {
  constructor(private readonly db: PrismaClient) {}

  async execute(noTransaksi: string, alasanBatal: string) {
    return await this.db.$transaction(async (tx) => {
      const penjualan = await tx.penjualan.findUnique({
        where: { noTransaksi },
        include: { kavling: true },
      });

      if (!penjualan) throw new NotFoundError("Data Penjualan tidak ditemukan");

      const updatedPenjualan = await tx.penjualan.update({
        where: { id: penjualan.id },
        data: {
          status: "BATAL",
          alasanBatal: alasanBatal,
        },
      });

      await tx.kavling.update({
        where: { id: penjualan.kavlingId },
        data: { status: "AVAILABLE" },
      });

      await tx.tagihan.deleteMany({
        where: {
          penjualanId: penjualan.id,
          status: "BELUM_BAYAR",
        },
      });

      return updatedPenjualan;
    });
  }
}
