import type { PrismaClient } from "@prisma/client";
import { NotFoundError } from "../../../domain/errors/NotFoundError.js";
import { ConflictError } from "../../../domain/errors/ConflictError.js";
export class ApproveBatalUseCase {
  constructor(private readonly db: PrismaClient) {}
  async execute(
    pengajuanId: number,
    approvedById: number,
    isApproved: boolean,
  ) {
    return await this.db.$transaction(async (tx) => {
      const pengajuan = await tx.pengajuanBatal.findUnique({
        where: { id: pengajuanId },
        include: { penjualan: true },
      });
      if (!pengajuan)
        throw new NotFoundError("Pengajuan batal tidak ditemukan");
      if (pengajuan.status !== "PENDING")
        throw new ConflictError("Pengajuan ini sudah diproses");
      if (!isApproved) {
        return await tx.pengajuanBatal.update({
          where: { id: pengajuanId },
          data: { status: "REJECTED", approvedById },
        });
      }
      const updatedPengajuan = await tx.pengajuanBatal.update({
        where: { id: pengajuanId },
        data: { status: "APPROVED", approvedById },
      });
      await tx.penjualan.update({
        where: { id: pengajuan.penjualanId },
        data: {
          status: "BATAL",
          alasanBatal: pengajuan.alasan,
        },
      });
      await tx.kavling.update({
        where: { id: pengajuan.penjualan.kavlingId },
        data: { status: "AVAILABLE" },
      });
      await tx.tagihan.deleteMany({
        where: {
          penjualanId: pengajuan.penjualanId,
          status: "BELUM_BAYAR",
        },
      });
      return updatedPengajuan;
    });
  }
}
