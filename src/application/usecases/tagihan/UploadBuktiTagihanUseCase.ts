import type { ITagihanRepository } from "../../../domain/repositories/ITagihanRepo.js";
import type { CloudinaryService } from "../../../infrastructure/external/CloudinaryService.js";
import type { TagihanResponseDTO } from "../../../domain/dtos/TagihanDTO.js";
import { NotFoundError } from "../../../domain/errors/NotFoundError.js";
import { AppError } from "../../../domain/errors/AppError.js";
import { StatusCodes } from "http-status-codes";

export class UploadBuktiTagihanUseCase {
  constructor(
    private readonly repo: ITagihanRepository,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async execute(id: number, fileBuffer: Buffer): Promise<TagihanResponseDTO> {
    const existing = await this.repo.findById(id);
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

    return await this.repo.update(id, updateData);
  }
}
