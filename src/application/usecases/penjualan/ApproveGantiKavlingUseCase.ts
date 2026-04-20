import type { PrismaClient } from "@prisma/client";
import { NotFoundError } from "../../../domain/errors/NotFoundError.js";
import { ConflictError } from "../../../domain/errors/ConflictError.js";

export class ApproveGantiKavlingUseCase {
  constructor(private readonly db: PrismaClient) {}

  async execute(riwayatId: number, approvedById: number, isApproved: boolean) {
    return await this.db.$transaction(async (tx) => {
      const riwayat = await tx.riwayatGantiKavling.findUnique({
        where: { id: riwayatId },
        include: {
          penjualan: { include: { kavling: true, detailKavlingPajak: true } },
          kavlingBaru: true,
        },
      });

      if (!riwayat)
        throw new NotFoundError("Pengajuan ganti kavling tidak ditemukan");
      if (riwayat.status !== "PENDING")
        throw new ConflictError("Pengajuan ini sudah diproses");

      if (!isApproved) {
        await tx.kavling.update({
          where: { id: riwayat.kavlingBaruId },
          data: { status: "AVAILABLE" },
        });

        return await tx.riwayatGantiKavling.update({
          where: { id: riwayatId },
          data: { status: "REJECTED", approvedById },
        });
      }

      await tx.kavling.update({
        where: { id: riwayat.kavlingLamaId },
        data: { status: "AVAILABLE" },
      });

      await tx.kavling.update({
        where: { id: riwayat.kavlingBaruId },
        data: { status: riwayat.penjualan.kavling.status },
      });

      await tx.penjualan.update({
        where: { id: riwayat.penjualanId },
        data: {
          kavlingId: riwayat.kavlingBaruId,
          hargaJual: riwayat.kavlingBaru.hargaJual,
        },
      });

      if (riwayat.penjualan.detailKavlingPajak) {
        await tx.detailKavlingPajak.update({
          where: { penjualanId: riwayat.penjualanId },
          data: { luasBangunan: riwayat.kavlingBaru.luasBangunan.toString() },
        });
      }

      return await tx.riwayatGantiKavling.update({
        where: { id: riwayatId },
        data: { status: "APPROVED", approvedById },
      });
    });
  }
}
