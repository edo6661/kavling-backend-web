import type { IKavlingRepository } from "../../../domain/repositories/IKavlingRepo.js";
import type {
  CreateKavlingDTO,
  UpdateKavlingDTO,
  KavlingFilterDTO,
  KavlingResponseDTO,
} from "../../../domain/dtos/KavlingDTO.js";
import type { OffsetPaginatedData } from "../../../types/response.js";
import { NotFoundError } from "../../../domain/errors/NotFoundError.js";
import type { CloudinaryService } from "../../../infrastructure/external/CloudinaryService.js";

export class CreateKavlingUseCase {
  constructor(private readonly repo: IKavlingRepository) {}
  async execute(data: CreateKavlingDTO): Promise<KavlingResponseDTO> {
    return await this.repo.create(data);
  }
}

export class UpdateKavlingUseCase {
  constructor(private readonly repo: IKavlingRepository) {}
  async execute(
    id: number,
    data: UpdateKavlingDTO,
  ): Promise<KavlingResponseDTO> {
    return await this.repo.update(id, data);
  }
}

export class GetKavlingByIdUseCase {
  constructor(private readonly repo: IKavlingRepository) {}
  async execute(id: number): Promise<KavlingResponseDTO> {
    const result = await this.repo.findById(id);
    if (!result) throw new NotFoundError("Kavling tidak ditemukan");
    return result;
  }
}

export class GetKavlingsPaginatedUseCase {
  constructor(private readonly repo: IKavlingRepository) {}
  async execute(
    page: number,
    limit: number,
    filters?: KavlingFilterDTO,
  ): Promise<OffsetPaginatedData<KavlingResponseDTO>> {
    return await this.repo.findWithCursorPagination(page, limit, filters);
  }
}
export class DeleteKavlingUseCase {
  constructor(
    private readonly repo: IKavlingRepository,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async execute(id: number): Promise<void> {
    const kavling = await this.repo.findById(id);
    if (!kavling) throw new NotFoundError("Kavling tidak ditemukan");

    const filesToDelete = [
      kavling.filePbg,
      kavling.fileSertifikatTanah,
      kavling.fileNopPbb,
    ].filter(Boolean) as string[];

    for (const url of filesToDelete) {
      await this.cloudinaryService
        .deleteImageByUrl(url)
        .catch((err) =>
          console.error(`Gagal hapus file saat delete kavling: ${url}`, err),
        );
    }

    await this.repo.delete(id);
  }
}
