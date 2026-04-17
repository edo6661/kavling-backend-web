import type { PrismaClient } from "@prisma/client";
import type { CloudinaryService } from "../../../infrastructure/external/CloudinaryService.js";
import { NotFoundError } from "../../../domain/errors/NotFoundError.js";
import { AppError } from "../../../domain/errors/AppError.js";
import { StatusCodes } from "http-status-codes";

export class UploadBuktiRefundUseCase {
  constructor(
    private readonly db: PrismaClient,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async execute(tagihanId: number, fileBuffer: Buffer) {
    if (!fileBuffer) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "File dokumen refund tidak boleh kosong",
      );
    }

    const existingTagihan = await this.db.tagihan.findUnique({
      where: { id: tagihanId },
    });

    if (!existingTagihan) {
      throw new NotFoundError("Data Tagihan tidak ditemukan");
    }

    if (existingTagihan.fileBuktiRefund) {
      await this.cloudinaryService.deleteImageByUrl(
        existingTagihan.fileBuktiRefund,
      );
    }

    const imageUrl = await this.cloudinaryService.uploadImage(
      fileBuffer,
      "bumantara/refund",
    );

    const updatedTagihan = await this.db.tagihan.update({
      where: { id: tagihanId },
      data: {
        isRefunded: true,
        fileBuktiRefund: imageUrl,
      },
    });

    return updatedTagihan;
  }
}
