import type { PrismaClient } from "@prisma/client";
import type { CloudinaryService } from "../../../infrastructure/external/CloudinaryService.js";
import type { GenerateSprPdfUseCase } from "./GenerateSprPdfUseCase.js";
import { AppError } from "../../../domain/errors/AppError.js";
import { StatusCodes } from "http-status-codes";
import { normalizeTagihanFileBuktiList } from "../../../utils/tagihanBukti.js";
import { effectiveTagihanTujuan } from "../../../domain/tagihan/tagihanTujuan.js";
export class UploadBuktiPenjualanUseCase {
  constructor(
    private readonly db: PrismaClient,
    private readonly cloudinaryService: CloudinaryService,
    private readonly generateSprPdfUseCase: GenerateSprPdfUseCase,
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
      updateData.status = "PROSES";
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
      await this.db.tagihan.update({
        where: { id: tagihanTerkait.id },
        data: {
          status: "LUNAS",
          fileBukti: mergedList[0] ?? imageUrl,
          fileBuktiList: mergedList,
        },
      });
    }
    return updatedPenjualan;
  }
}
