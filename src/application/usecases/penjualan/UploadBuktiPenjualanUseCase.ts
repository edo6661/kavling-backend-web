import type { PrismaClient } from "@prisma/client";
import type { CloudinaryService } from "../../../infrastructure/external/CloudinaryService.js";
import type { GenerateSprPdfUseCase } from "./GenerateSprPdfUseCase.js";
import { AppError } from "../../../domain/errors/AppError.js";
import { StatusCodes } from "http-status-codes";
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
    const tagihanTerkait = penjualan.tagihan.find((t) =>
      t.pembayaran.toLowerCase().includes(keyword),
    );
    if (tagihanTerkait) {
      await this.db.tagihan.update({
        where: { id: tagihanTerkait.id },
        data: { status: "LUNAS", fileBukti: imageUrl },
      });
    }
    return updatedPenjualan;
  }
}
