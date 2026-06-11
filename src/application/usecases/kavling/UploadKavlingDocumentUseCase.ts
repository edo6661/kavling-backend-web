import type { IKavlingRepository } from "../../../domain/repositories/IKavlingRepo.js";
import type { CloudinaryService } from "../../../infrastructure/external/CloudinaryService.js";
import type { GoogleVisionService } from "../../../infrastructure/external/GoogleVisionService.js";
import { NotFoundError } from "../../../domain/errors/NotFoundError.js";
import { AppError } from "../../../domain/errors/AppError.js";
import { StatusCodes } from "http-status-codes";
import { extractNopdFromPbbPdfBuffer } from "../../../infrastructure/utils/pbbPdfUtils.js";

export class UploadKavlingDocumentUseCase {
  constructor(
    private readonly repo: IKavlingRepository,
    private readonly cloudinaryService: CloudinaryService,
    private readonly googleVisionService: GoogleVisionService,
  ) {}
  async execute(
    id: number,
    fileBuffer: Buffer,
    docType: "filePbg" | "fileSertifikatTanah" | "fileNopPbb",
  ) {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new NotFoundError("Kavling tidak ditemukan");
    }
    if (!fileBuffer) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "File dokumen tidak boleh kosong",
      );
    }
    if (existing[docType]) {
      await this.cloudinaryService.deleteImageByUrl(existing[docType]);
    }
    const fileUrl = await this.cloudinaryService.uploadFile(
      fileBuffer,
      `bumantara/kavling/${docType}`,
    );

    const updateData: {
      filePbg?: string;
      fileSertifikatTanah?: string;
      fileNopPbb?: string;
      nopd?: string;
    } = { [docType]: fileUrl };

    if (docType === "fileNopPbb") {
      const nopd = await extractNopdFromPbbPdfBuffer(
        fileBuffer,
        this.googleVisionService,
      );
      if (nopd) updateData.nopd = nopd;
    }

    return await this.repo.update(id, updateData);
  }
}
