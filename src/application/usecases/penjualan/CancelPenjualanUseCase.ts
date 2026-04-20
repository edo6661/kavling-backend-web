import type { PrismaClient } from "@prisma/client";
import { NotFoundError } from "../../../domain/errors/NotFoundError.js";
import { ConflictError } from "../../../domain/errors/ConflictError.js";

export class CancelPenjualanUseCase {
  constructor(private readonly db: PrismaClient) {}

  async execute(
    noTransaksi: string,
    alasanBatal: string,
    requestedById: number,
  ) {
    return await this.db.$transaction(async (tx) => {
      const penjualan = await tx.penjualan.findUnique({
        where: { noTransaksi },
        include: { pengajuanBatal: { where: { status: "PENDING" } } },
      });

      if (!penjualan) throw new NotFoundError("Data Penjualan tidak ditemukan");
      if (penjualan.status === "BATAL")
        throw new ConflictError("Penjualan sudah dibatalkan sebelumnya");
      if (penjualan.status === "LUNAS")
        throw new ConflictError(
          "Penjualan Lunas tidak bisa dibatalkan sembarangan",
        );
      if (penjualan.pengajuanBatal.length > 0) {
        throw new ConflictError(
          "Sudah ada pengajuan pembatalan yang menunggu persetujuan (PENDING).",
        );
      }

      return await tx.pengajuanBatal.create({
        data: {
          penjualanId: penjualan.id,
          alasan: alasanBatal,
          status: "PENDING",
          requestedById: requestedById,
        },
      });
    });
  }
}
