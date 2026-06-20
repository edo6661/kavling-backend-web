import type { IKavlingRepository } from "../../../domain/repositories/IKavlingRepo.js";
import type { CloudinaryService } from "../../../infrastructure/external/CloudinaryService.js";
import { NotFoundError } from "../../../domain/errors/NotFoundError.js";
import { AppError } from "../../../domain/errors/AppError.js";
import { StatusCodes } from "http-status-codes";

export class DeleteKavlingSertifikatTambahanDocumentUseCase {
  constructor(
    private readonly repo: IKavlingRepository,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async execute(
    id: number,
    urutan: number,
    docType: "filePbg" | "fileSertifikatTanah" | "fileNopPbb",
  ) {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new NotFoundError("Kavling tidak ditemukan");
    }
    if (urutan < 2 || urutan > existing.jumlahSertifikatTanah) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        `Urutan sertifikat ${urutan} tidak valid. Kavling ini memiliki ${existing.jumlahSertifikatTanah} sertifikat tanah.`,
      );
    }

    const currentRow = existing.sertifikatTanahTambahan?.find(
      (row) => row.urutan === urutan,
    );
    const oldFileUrl = currentRow?.[docType];
    if (!oldFileUrl) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "Dokumen tidak ditemukan atau sudah kosong.",
      );
    }

    await this.cloudinaryService.deleteImageByUrl(oldFileUrl);

    return await this.repo.clearSertifikatTambahanDocument(
      id,
      urutan,
      docType,
      docType === "fileNopPbb" ? { clearNopd: true } : undefined,
    );
  }
}
