import type { PrismaClient } from "@prisma/client";
import { NotFoundError } from "../../../domain/errors/NotFoundError.js";
import { ConflictError } from "../../../domain/errors/ConflictError.js";
import { AppError } from "../../../domain/errors/AppError.js";
import { StatusCodes } from "http-status-codes";
import type { NotificationService } from "../../../infrastructure/notifications/NotificationService.js";
import { Role } from "@prisma/client";

export class GantiKavlingUseCase {
  constructor(
    private readonly db: PrismaClient,
    private readonly notificationService?: NotificationService,
  ) {}

  async execute(
    noTransaksi: string,
    kavlingBaruId: number,
    alasan: string,
    requestedById: number,
  ) {
    return await this.db.$transaction(async (tx) => {
      const penjualan = await tx.penjualan.findUnique({
        where: { noTransaksi },
        include: { riwayatGantiKavling: { where: { status: "PENDING" } } },
      });

      if (!penjualan) throw new NotFoundError("Data Penjualan tidak ditemukan");
      if (penjualan.status === "BATAL" || penjualan.status === "LUNAS") {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          "Status penjualan tidak valid untuk ganti kavling",
        );
      }
      if (penjualan.riwayatGantiKavling.length > 0) {
        throw new ConflictError(
          "Masih ada pengajuan ganti kavling yang menunggu persetujuan.",
        );
      }

      const kavlingBaru = await tx.kavling.findUnique({
        where: { id: kavlingBaruId },
      });

      if (!kavlingBaru) throw new NotFoundError("Kavling baru tidak ditemukan");
      if (kavlingBaru.status !== "AVAILABLE") {
        throw new ConflictError(
          "Kavling baru sudah terisi atau tidak tersedia",
        );
      }

      await tx.kavling.update({
        where: { id: kavlingBaru.id },
        data: { status: "HOLD" },
      });

      const riwayat = await tx.riwayatGantiKavling.create({
        data: {
          penjualanId: penjualan.id,
          kavlingLamaId: penjualan.kavlingId,
          kavlingBaruId: kavlingBaru.id,
          alasan: alasan,
          status: "PENDING",
          requestedById: requestedById,
        },
      });

      if (this.notificationService) {
        try {
          await this.notificationService.notifyRoles(
            [Role.ADMIN, Role.SUPERADMIN],
            {
              type: "GANTI_KAVLING",
              title: "Pengajuan Ganti Kavling",
              message: `Terdapat pengajuan ganti kavling untuk transaksi ${noTransaksi} yang memerlukan persetujuan.`,
              data: { riwayatId: riwayat.id, noTransaksi },
              linkPath: "/management/ganti-kavling",
            },
          );
        } catch (error) {
          console.error("Gagal mengirim notifikasi ganti kavling:", error);
        }
      }

      return riwayat;
    });
  }
}
