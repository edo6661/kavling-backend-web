import type { TukangRepository } from "../../../domain/repositories/tukangRepo.js";
import type { CloudinaryService } from "../../../infrastructure/external/CloudinaryService.js";
import type { TukangEntity } from "../../../domain/entities/Tukang.js";
import type { TukangListContext } from "../../../domain/dtos/TukangDTO.js";
import { AppError } from "../../../domain/errors/AppError.js";
import { StatusCodes } from "http-status-codes";

export class UploadTukangKtpUseCase {
  constructor(
    private readonly tukangRepo: TukangRepository,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async execute(
    nik: string,
    fileBuffer: Buffer,
    ctx: TukangListContext,
  ): Promise<TukangEntity> {
    if (!fileBuffer?.length) {
      throw new AppError(StatusCodes.BAD_REQUEST, "File foto KTP wajib diunggah");
    }

    const existing = await this.tukangRepo.findByNik(nik);
    if (!existing) {
      throw new AppError(StatusCodes.NOT_FOUND, "Tukang tidak ditemukan");
    }

    if (existing.fileKtp) {
      await this.cloudinaryService.deleteImageByUrl(existing.fileKtp);
    }

    const fileUrl = await this.cloudinaryService.uploadImage(
      fileBuffer,
      "bumantara/tukang/fileKtp",
    );

    return this.tukangRepo.updateFileKtp(nik, fileUrl, ctx);
  }
}
