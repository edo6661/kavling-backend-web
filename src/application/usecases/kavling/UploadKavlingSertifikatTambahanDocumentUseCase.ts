import type { IKavlingRepository } from "../../../domain/repositories/IKavlingRepo.js";
import type { CloudinaryService } from "../../../infrastructure/external/CloudinaryService.js";
import type { GoogleVisionService } from "../../../infrastructure/external/GoogleVisionService.js";
import { NotFoundError } from "../../../domain/errors/NotFoundError.js";
import { AppError } from "../../../domain/errors/AppError.js";
import { StatusCodes } from "http-status-codes";
import { extractNopdFromPbbPdfBuffer } from "../../../infrastructure/utils/pbbPdfUtils.js";

export class UploadKavlingSertifikatTambahanDocumentUseCase {
  constructor(
    private readonly repo: IKavlingRepository,
    private readonly cloudinaryService: CloudinaryService,
    private readonly googleVisionService: GoogleVisionService,
  ) {}

  async execute(
    id: number,
    urutan: number,
    fileBuffer: Buffer,
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
    if (!fileBuffer) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "File dokumen tidak boleh kosong",
      );
    }

    const currentRow = existing.sertifikatTanahTambahan?.find(
      (row) => row.urutan === urutan,
    );
    const oldFileUrl = currentRow?.[docType];
    if (oldFileUrl) {
      await this.cloudinaryService.deleteImageByUrl(oldFileUrl);
    }

    const fileUrl = await this.cloudinaryService.uploadFile(
      fileBuffer,
      `bumantara/kavling/tambahan/${docType}`,
    );

    let nopd: string | null | undefined;
    if (docType === "fileNopPbb") {
      nopd = await extractNopdFromPbbPdfBuffer(
        fileBuffer,
        this.googleVisionService,
      );
    }

    return await this.repo.upsertSertifikatTambahanDocument(
      id,
      urutan,
      docType,
      fileUrl,
      nopd ? { nopd } : undefined,
    );
  }
}
