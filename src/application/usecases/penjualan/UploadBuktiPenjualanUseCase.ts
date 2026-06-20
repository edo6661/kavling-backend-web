import { Role } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";
import type { CloudinaryService } from "../../../infrastructure/external/CloudinaryService.js";
import type { NotificationService } from "../../../infrastructure/notifications/NotificationService.js";
import { AppError } from "../../../domain/errors/AppError.js";
import { StatusCodes } from "http-status-codes";
import { normalizeTagihanFileBuktiList } from "../../../utils/tagihanBukti.js";
import { effectiveTagihanTujuan } from "../../../domain/tagihan/tagihanTujuan.js";

export class UploadBuktiPenjualanUseCase {
  constructor(
    private readonly db: PrismaClient,
    private readonly cloudinaryService: CloudinaryService,
    private readonly notificationService?: NotificationService,
  ) {}

  async execute(id: string, type: "booking" | "dp", fileBuffer: Buffer) {
    if (!fileBuffer) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "File dokumen tidak boleh kosong",
      );
    }
    const penjualan = await this.db.penjualan.findUnique({
      where: { noTransaksi: id },
      include: { tagihan: true },
    });
    if (!penjualan)
      throw new AppError(
        StatusCodes.NOT_FOUND,
        "Data Penjualan tidak ditemukan",
      );
    if (type === "booking" && penjualan.fileBuktiBooking) {
      await this.cloudinaryService
        .deleteImageByUrl(penjualan.fileBuktiBooking)
        .catch(console.error);
    } else if (type === "dp" && penjualan.fileBuktiDp) {
      await this.cloudinaryService
        .deleteImageByUrl(penjualan.fileBuktiDp)
        .catch(console.error);
    }
    const folderPath = `bumantara/penjualan/${type}`;
    const imageUrl = await this.cloudinaryService.uploadImage(
      fileBuffer,
      folderPath,
    );
    const updateData: Record<string, string> = {};

    if (type === "booking") {
      updateData.fileBuktiBooking = imageUrl;
    }

    if (type === "dp") {
      updateData.fileBuktiDp = imageUrl;
    }

    const updatedPenjualan = await this.db.penjualan.update({
      where: { id: penjualan.id },
      data: updateData,
    });
    const keyword = type === "booking" ? "booking" : "dp";
    const tagihanTerkait =
      type === "booking"
        ? penjualan.tagihan.find(
            (t) => t.noTagihan === `INV-BF-${penjualan.noTransaksi}`,
          ) ??
          penjualan.tagihan.find((t) =>
            t.pembayaran.toLowerCase().includes(keyword),
          )
        : penjualan.tagihan.find(
            (t) =>
              effectiveTagihanTujuan(t) === "DP" &&
              t.status === "BELUM_BAYAR",
          ) ??
          penjualan.tagihan.find((t) => effectiveTagihanTujuan(t) === "DP");
    if (tagihanTerkait) {
      const currentList = normalizeTagihanFileBuktiList(
        tagihanTerkait.fileBuktiList,
        tagihanTerkait.fileBukti,
      );
      const mergedList = [...currentList, imageUrl];
      const tagihanUpdate: {
        fileBukti: string;
        fileBuktiList: string[];
        status?: "MENUNGGU_KONFIRMASI" | "LUNAS";
      } = {
        fileBukti: mergedList[0] ?? imageUrl,
        fileBuktiList: mergedList,
      };

      if (type === "booking") {
        if (
          tagihanTerkait.status === "BELUM_BAYAR" ||
          tagihanTerkait.status === "MENUNGGU_KONFIRMASI"
        ) {
          tagihanUpdate.status = "MENUNGGU_KONFIRMASI";
        }
      } else {
        tagihanUpdate.status = "LUNAS";
      }

      await this.db.tagihan.update({
        where: { id: tagihanTerkait.id },
        data: tagihanUpdate,
      });

      if (
        type === "booking" &&
        tagihanUpdate.status === "MENUNGGU_KONFIRMASI" &&
        this.notificationService
      ) {
        try {
          await this.notificationService.notifyRoles(
            [Role.ADMIN, Role.SUPERADMIN, Role.FINANCE],
            {
              type: "UPLOAD_BUKTI",
              title: "Bukti Booking Fee Baru",
              message: `Bukti transfer booking fee transaksi ${penjualan.noTransaksi} menunggu konfirmasi.`,
              data: {
                tagihanId: tagihanTerkait.id,
                noTagihan: tagihanTerkait.noTagihan,
                penjualanId: penjualan.noTransaksi,
              },
              linkPath: "/finance/approve-pembayaran",
            },
          );
        } catch (error) {
          console.error("Gagal mengirim notifikasi upload bukti booking:", error);
        }
      }
    }
    return updatedPenjualan;
  }
}
