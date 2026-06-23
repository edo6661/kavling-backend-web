import type { IFeeAgentRepository } from "../../../domain/repositories/IFeeAgentRepo.js";
import type {
  UpdateFeeAgentDTO,
  FeeAgentFilterDTO,
} from "../../../domain/dtos/FeeAgentDTO.js";
import type { CloudinaryService } from "../../../infrastructure/external/CloudinaryService.js";
import { NotFoundError } from "../../../domain/errors/NotFoundError.js";
import { AppError } from "../../../domain/errors/AppError.js";
import { StatusCodes } from "http-status-codes";

export class GetFeeAgentsPaginatedUseCase {
  constructor(private readonly repo: IFeeAgentRepository) {}
  async execute(limit: number, cursor?: number, filters?: FeeAgentFilterDTO) {
    return await this.repo.findWithCursorPagination(limit, cursor, filters);
  }
}

export class UpdateFeeAgentUseCase {
  constructor(private readonly repo: IFeeAgentRepository) {}
  async execute(id: number, data: UpdateFeeAgentDTO) {
    return await this.repo.update(id, data);
  }
}

export class BackfillFeeAgentUseCase {
  constructor(private readonly repo: IFeeAgentRepository) {}

  async execute() {
    return await this.repo.backfillMissing();
  }
}

export class UploadBuktiFeeUseCase {
  constructor(
    private readonly repo: IFeeAgentRepository,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async execute(
    id: number,
    fileBuffer: Buffer,
    type: "bookingBukti" | "closingBukti" | "marketingBukti",
  ) {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new NotFoundError("Data Fee Agent tidak ditemukan");
    }

    if (!fileBuffer) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "File dokumen tidak boleh kosong",
      );
    }

    if (existing[type]) {
      await this.cloudinaryService.deleteImageByUrl(existing[type]);
    }

    const imageUrl = await this.cloudinaryService.uploadImage(
      fileBuffer,
      `bumantara/fee/${type}`,
    );

    const updateData = { [type]: imageUrl };
    return await this.repo.update(id, updateData);
  }
}
