import type { IKavlingRepository } from "../../../domain/repositories/IKavlingRepo.js";
import type { UpdateKavlingDTO } from "../../../domain/dtos/KavlingDTO.js";
import type { CloudinaryService } from "../../../infrastructure/external/CloudinaryService.js";
import { NotFoundError } from "../../../domain/errors/NotFoundError.js";
import { AppError } from "../../../domain/errors/AppError.js";
import { StatusCodes } from "http-status-codes";

export class DeleteKavlingDocumentUseCase {
  constructor(
    private readonly repo: IKavlingRepository,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async execute(
    id: number,
    docType: "filePbg" | "fileSertifikatTanah" | "fileNopPbb",
  ) {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new NotFoundError("Kavling tidak ditemukan");
    }

    const oldFileUrl = existing[docType];
    if (!oldFileUrl) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "Dokumen tidak ditemukan atau sudah kosong.",
      );
    }

    await this.cloudinaryService.deleteImageByUrl(oldFileUrl);

    const updateData: UpdateKavlingDTO = { [docType]: null };

    if (docType === "fileNopPbb") {
      updateData.nopd = null;
    }

    return await this.repo.update(id, updateData);
  }
}
