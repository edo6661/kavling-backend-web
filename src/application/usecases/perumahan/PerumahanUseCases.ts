import type { IPerumahanRepository } from "../../../domain/repositories/IPerumahanRepo.js";
import type {
  CreatePerumahanDTO,
  UpdatePerumahanDTO,
  PerumahanFilterDTO,
  PerumahanResponseDTO,
} from "../../../domain/dtos/PerumahanDTO.js";
import type { CursorPaginatedData } from "../../../types/response.js";
import { NotFoundError } from "../../../domain/errors/NotFoundError.js";
import { PerumahanMapper } from "../../../infrastructure/mapper/PerumahanMapper.js";

export class CreatePerumahanUseCase {
  constructor(private readonly repo: IPerumahanRepository) {}
  async execute(data: CreatePerumahanDTO): Promise<PerumahanResponseDTO> {
    const result = await this.repo.create(data);
    return PerumahanMapper.toDomain(result);
  }
}

export class UpdatePerumahanUseCase {
  constructor(private readonly repo: IPerumahanRepository) {}
  async execute(
    id: number,
    data: UpdatePerumahanDTO,
  ): Promise<PerumahanResponseDTO> {
    const result = await this.repo.update(id, data);
    return PerumahanMapper.toDomain(result);
  }
}

export class GetPerumahanByIdUseCase {
  constructor(private readonly repo: IPerumahanRepository) {}
  async execute(id: number): Promise<PerumahanResponseDTO> {
    const result = await this.repo.findById(id);
    if (!result) throw new NotFoundError("Perumahan tidak ditemukan");
    return PerumahanMapper.toDomain(result);
  }
}

export class GetPerumahanPaginatedUseCase {
  constructor(private readonly repo: IPerumahanRepository) {}
  async execute(
    limit: number,
    cursor?: number,
    filters?: PerumahanFilterDTO,
  ): Promise<CursorPaginatedData<PerumahanResponseDTO>> {
    const result = await this.repo.findWithCursorPagination(
      limit,
      cursor,
      filters,
    );
    const mappedItems = result.items.map((item) =>
      PerumahanMapper.toDomain(item),
    );
    return {
      items: mappedItems,
      meta: result.meta,
    };
  }
}

export class DeletePerumahanUseCase {
  constructor(private readonly repo: IPerumahanRepository) {}
  async execute(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}
