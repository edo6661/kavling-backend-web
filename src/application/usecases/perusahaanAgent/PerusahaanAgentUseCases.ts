import type { IPerusahaanAgentRepository } from "../../../domain/repositories/IPerusahaanAgentRepo.js";
import type { CloudinaryService } from "../../../infrastructure/external/CloudinaryService.js";
import { NotFoundError } from "../../../domain/errors/NotFoundError.js";
import { AppError } from "../../../domain/errors/AppError.js";
import { StatusCodes } from "http-status-codes";
import type {
  CreatePerusahaanAgentDTO,
  UpdatePerusahaanAgentDTO,
} from "../../../domain/dtos/PerusahaanAgentDTO.js";

export class PerusahaanAgentUseCases {
  constructor(
    private readonly repo: IPerusahaanAgentRepository,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async create(data: CreatePerusahaanAgentDTO) {
    return await this.repo.create(data);
  }

  async getAll(limit: number, cursor?: number, search?: string) {
    return await this.repo.findWithCursorPagination(limit, cursor, { search });
  }

  async update(id: number, data: UpdatePerusahaanAgentDTO) {
    return await this.repo.update(id, data);
  }

  async delete(id: number) {
    return await this.repo.delete(id);
  }

  async uploadAkte(id: number, fileBuffer: Buffer) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError("Perusahaan tidak ditemukan");
    if (!fileBuffer)
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "File Akte tidak boleh kosong",
      );

    if (existing.akte) {
      await this.cloudinary.deleteImageByUrl(existing.akte);
    }

    const imageUrl = await this.cloudinary.uploadImage(
      fileBuffer,
      `bumantara/perusahaan_agent`,
    );
    return await this.repo.update(id, { akte: imageUrl });
  }
}
