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
  ): Promise<ProgressPenjualanResponseDTO> {
    let existing = await this.repo.findByPenjualanId(penjualanId);
    existing ??= await this.repo.create({ penjualanId });

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
      `bumantara/progress_penjualan/${docType}`,
    );

    const updateData: UpdateProgressPenjualanDTO = { [docType]: fileUrl };
    return await this.repo.update(penjualanId, updateData);
  }
}
