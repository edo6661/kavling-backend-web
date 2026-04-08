import type { IMasterDataProgressRepository } from "../../../domain/repositories/IMasterDataProgressRepo.js";
import type { CloudinaryService } from "../../../infrastructure/external/CloudinaryService.js";
import type { MasterDataProgressResponseDTO } from "../../../domain/dtos/MasterDataProgressDTO.js";
import { MasterDataProgressMapper } from "../../../infrastructure/mapper/MasterDataProgressMapper.js";
import { NotFoundError } from "../../../domain/errors/NotFoundError.js";
import { AppError } from "../../../domain/errors/AppError.js";
import { StatusCodes } from "http-status-codes";

export class UploadMasterDataProgressDocumentUseCase {
  constructor(
    private readonly repo: IMasterDataProgressRepository,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async execute(
    id: number,
    fileBuffer: Buffer,
    docType: "buktiTransferClosingFee" | "buktiTransferMarketingFee",
  ): Promise<MasterDataProgressResponseDTO> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new NotFoundError("Data progress tidak ditemukan");
    }

    if (!fileBuffer) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "File bukti transfer tidak boleh kosong",
      );
    }

    if (existing[docType]) {
      await this.cloudinaryService.deleteImageByUrl(existing[docType]);
    }

    const imageUrl = await this.cloudinaryService.uploadImage(
      fileBuffer,
      `progress_${docType}`,
    );

    const updateData = {
      [docType]: imageUrl,
    };

    const result = await this.repo.update(id, updateData);
    return MasterDataProgressMapper.toDomain(result);
  }
}
