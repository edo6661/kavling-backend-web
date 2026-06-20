import type { IProgressPenjualanRepository } from "../../../domain/repositories/IProgressPenjualanRepo.js";
import type {
  UpdateProgressPenjualanDTO,
  ProgressPenjualanResponseDTO,
} from "../../../domain/dtos/ProgressPenjualanDTO.js";
import type { CloudinaryService } from "../../../infrastructure/external/CloudinaryService.js";
import { AppError } from "../../../domain/errors/AppError.js";
import { StatusCodes } from "http-status-codes";

export class GetProgressPenjualanUseCase {
  constructor(private readonly repo: IProgressPenjualanRepository) {}

  async execute(penjualanId: number): Promise<ProgressPenjualanResponseDTO> {
    let progress = await this.repo.findByPenjualanId(penjualanId);

    progress ??= await this.repo.create({ penjualanId });
    return progress;
  }
}

export class UpdateProgressPenjualanUseCase {
  constructor(private readonly repo: IProgressPenjualanRepository) {}

  async execute(
    penjualanId: number,
    data: UpdateProgressPenjualanDTO,
  ): Promise<ProgressPenjualanResponseDTO> {
    const existing = await this.repo.findByPenjualanId(penjualanId);
    if (!existing) {
      await this.repo.create({ penjualanId });
    }

    return await this.repo.update(penjualanId, data);
  }
}

const MULTI_SERTIFIKAT_DOC_TYPES = new Set(["filePpjb", "fileAjb"]);

export class UploadProgressDocumentUseCase {
  constructor(
    private readonly repo: IProgressPenjualanRepository,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async execute(
    penjualanId: number,
    fileBuffer: Buffer,
    docType:
      | "fileSp3k"
      | "fileSuratPernyataanAkadKredit"
      | "fileSalinanAjb"
      | "filePpjb"
      | "fileAjb"
      | "fileBast",
    sertifikatUrutan = 1,
  ): Promise<ProgressPenjualanResponseDTO> {
    let existing = await this.repo.findByPenjualanId(penjualanId);
    existing ??= await this.repo.create({ penjualanId });

    if (!fileBuffer) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "File dokumen tidak boleh kosong",
      );
    }

    if (sertifikatUrutan >= 2) {
      if (!MULTI_SERTIFIKAT_DOC_TYPES.has(docType)) {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          `Dokumen ${docType} tidak mendukung sertifikat tambahan.`,
        );
      }

      const multiDocType = docType as "filePpjb" | "fileAjb";
      const oldFileUrl = await this.repo.findSertifikatTambahanFileUrl(
        penjualanId,
        sertifikatUrutan,
        multiDocType,
      );
      if (oldFileUrl) {
        await this.cloudinaryService.deleteImageByUrl(oldFileUrl);
      }

      const fileUrl = await this.cloudinaryService.uploadFile(
        fileBuffer,
        `bumantara/progress_penjualan/tambahan/${docType}`,
      );

      return await this.repo.uploadSertifikatTambahanDocument(
        penjualanId,
        sertifikatUrutan,
        multiDocType,
        fileUrl,
      );
    }

    if (existing[docType]) {
      await this.cloudinaryService.deleteImageByUrl(existing[docType]!);
    }

    const fileUrl = await this.cloudinaryService.uploadFile(
      fileBuffer,
      `bumantara/progress_penjualan/${docType}`,
    );

    const updateData: UpdateProgressPenjualanDTO = { [docType]: fileUrl };
    return await this.repo.update(penjualanId, updateData);
  }
}

type ProgressDocumentType =
  | "fileSp3k"
  | "fileSuratPernyataanAkadKredit"
  | "fileSalinanAjb"
  | "filePpjb"
  | "fileAjb"
  | "fileBast";

export class DeleteProgressDocumentUseCase {
  constructor(
    private readonly repo: IProgressPenjualanRepository,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async execute(
    penjualanId: number,
    docType: ProgressDocumentType,
    sertifikatUrutan = 1,
  ): Promise<ProgressPenjualanResponseDTO> {
    const existing = await this.repo.findByPenjualanId(penjualanId);
    if (!existing) {
      throw new AppError(
        StatusCodes.NOT_FOUND,
        "Progress Penjualan tidak ditemukan.",
      );
    }

    if (sertifikatUrutan >= 2) {
      if (!MULTI_SERTIFIKAT_DOC_TYPES.has(docType)) {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          `Dokumen ${docType} tidak mendukung sertifikat tambahan.`,
        );
      }

      const multiDocType = docType as "filePpjb" | "fileAjb";
      const oldFileUrl = await this.repo.findSertifikatTambahanFileUrl(
        penjualanId,
        sertifikatUrutan,
        multiDocType,
      );
      if (!oldFileUrl) {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          "Dokumen tidak ditemukan atau sudah kosong.",
        );
      }

      await this.cloudinaryService.deleteImageByUrl(oldFileUrl);
      return await this.repo.updateSertifikatTambahan(
        penjualanId,
        sertifikatUrutan,
        { [multiDocType]: null },
      );
    }

    const oldFileUrl = existing[docType];
    if (!oldFileUrl) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "Dokumen tidak ditemukan atau sudah kosong.",
      );
    }

    await this.cloudinaryService.deleteImageByUrl(oldFileUrl);
    return await this.repo.update(penjualanId, { [docType]: null });
  }
}
