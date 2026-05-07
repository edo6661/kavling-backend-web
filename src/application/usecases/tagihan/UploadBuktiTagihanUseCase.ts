import type { ITagihanRepository } from "../../../domain/repositories/ITagihanRepo.js";
import type { CloudinaryService } from "../../../infrastructure/external/CloudinaryService.js";
import type { TagihanResponseDTO } from "../../../domain/dtos/TagihanDTO.js";
import { NotFoundError } from "../../../domain/errors/NotFoundError.js";
import { AppError } from "../../../domain/errors/AppError.js";
import { StatusCodes } from "http-status-codes";

import type { IPenjualanRepository } from "../../../domain/repositories/IPenjualanRepo.js";
import type { GenerateSprPdfUseCase } from "../penjualan/GenerateSprPdfUseCase.js";

export class UploadBuktiTagihanUseCase {
  constructor(
    private readonly repo: ITagihanRepository,
    private readonly cloudinaryService: CloudinaryService,

    private readonly penjualanRepo: IPenjualanRepository,
    private readonly generateSprPdfUseCase: GenerateSprPdfUseCase,
  ) {}
  async execute(
    identifier: number | string,
    fileBuffer: Buffer,
  ): Promise<TagihanResponseDTO> {
    const existing =
      typeof identifier === "number"
        ? await this.repo.findById(identifier)
        : await this.repo.findByNoTagihan(identifier);

    if (!existing) {
      throw new NotFoundError("Tagihan tidak ditemukan");
    }

    if (!fileBuffer) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "File dokumen tidak boleh kosong",
      );
    }

    if (existing.fileBukti) {
      await this.cloudinaryService.deleteImageByUrl(existing.fileBukti);
    }

    const imageUrl = await this.cloudinaryService.uploadImage(
      fileBuffer,
      "bumantara/tagihan",
    );

    const updateData = {
      fileBukti: imageUrl,
      status: "LUNAS" as const,
    };

    const updatedTagihan = await this.repo.update(existing.id, updateData);

    if (existing.pembayaran.toLowerCase().includes("booking")) {
      try {
        const pdfBuffer = await this.generateSprPdfUseCase.execute(
          existing.penjualanId,
        );

        const pdfUrl = await this.cloudinaryService.uploadFile(
          pdfBuffer,
          "bumantara/spr",
        );

        await this.penjualanRepo.update(existing.penjualanId, {
          fileSpr: pdfUrl,
        });
      } catch (error) {
        console.error("Gagal auto-generate SPR:", error);
      }
    }

    return updatedTagihan;
  }
}
