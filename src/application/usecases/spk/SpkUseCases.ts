import type { ISpkRepository } from "../../../domain/repositories/ISpkRepo.js";
import type {
  CreateSpkDTO,
  SpkFilterDTO,
  UpdateSpkDTO,
} from "../../../domain/dtos/SpkDTO.js";
import type { SpkEntity } from "../../../domain/entities/Spk.js";
import type { CursorPaginatedData } from "../../../types/response.js";
import { NotFoundError } from "../../../domain/errors/NotFoundError.js";
import type { CloudinaryService } from "../../../infrastructure/external/CloudinaryService.js";
import { AppError } from "../../../domain/errors/AppError.js";
import { StatusCodes } from "http-status-codes";

export class CreateSpkUseCase {
  constructor(
    private readonly repo: ISpkRepository,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async execute(
    data: CreateSpkDTO,
    fileBuffer?: Buffer,
  ): Promise<SpkEntity> {
    let fileSpk = data.fileSpk ?? null;
    if (fileBuffer) {
      fileSpk = await this.cloudinary.uploadFile(
        fileBuffer,
        "bumantara/spk",
      );
    }

    return await this.repo.create({ ...data, fileSpk });
  }
}

export class UpdateSpkUseCase {
  constructor(
    private readonly repo: ISpkRepository,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async execute(
    id: number,
    data: UpdateSpkDTO,
    fileBuffer?: Buffer,
  ): Promise<SpkEntity> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError("SPK tidak ditemukan");

    let fileSpk = data.fileSpk;
    if (fileBuffer) {
      fileSpk = await this.cloudinary.uploadFile(
        fileBuffer,
        "bumantara/spk",
      );
    }

    return await this.repo.update(id, {
      ...data,
      ...(fileSpk !== undefined ? { fileSpk } : {}),
    });
  }
}

export class GetSpkByIdUseCase {
  constructor(private readonly repo: ISpkRepository) {}

  async execute(id: number): Promise<SpkEntity> {
    const result = await this.repo.findById(id);
    if (!result) throw new NotFoundError("SPK tidak ditemukan");
    return result;
  }
}

export class GetSpkPaginatedUseCase {
  constructor(private readonly repo: ISpkRepository) {}

  async execute(
    limit: number,
    cursor?: number,
    filters?: SpkFilterDTO,
  ): Promise<CursorPaginatedData<SpkEntity>> {
    return await this.repo.findWithCursorPagination(limit, cursor, filters);
  }
}

export class DeleteSpkUseCase {
  constructor(private readonly repo: ISpkRepository) {}

  async execute(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}

export class UploadSpkDocumentUseCase {
  constructor(
    private readonly repo: ISpkRepository,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async execute(id: number, fileBuffer: Buffer): Promise<SpkEntity> {
    if (!fileBuffer?.length) {
      throw new AppError(StatusCodes.BAD_REQUEST, "File SPK wajib diunggah");
    }

    const fileSpk = await this.cloudinary.uploadFile(
      fileBuffer,
      "bumantara/spk",
    );

    return await this.repo.update(id, { fileSpk });
  }
}
