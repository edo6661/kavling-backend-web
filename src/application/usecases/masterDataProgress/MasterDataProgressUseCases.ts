import type { IMasterDataProgressRepository } from "../../../domain/repositories/IMasterDataProgressRepo.js";
import type {
  CreateMasterDataProgressDTO,
  UpdateMasterDataProgressDTO,
  MasterDataProgressFilterDTO,
  MasterDataProgressResponseDTO,
} from "../../../domain/dtos/MasterDataProgressDTO.js";
import type { CursorPaginatedData } from "../../../types/response.js";
import { MasterDataProgressMapper } from "../../../infrastructure/mapper/MasterDataProgressMapper.js";
import { NotFoundError } from "../../../domain/errors/NotFoundError.js";

export class CreateMasterDataProgressUseCase {
  constructor(private readonly repo: IMasterDataProgressRepository) {}
  async execute(
    data: CreateMasterDataProgressDTO,
  ): Promise<MasterDataProgressResponseDTO> {
    const result = await this.repo.create(data);
    return MasterDataProgressMapper.toDomain(result);
  }
}

export class UpdateMasterDataProgressUseCase {
  constructor(private readonly repo: IMasterDataProgressRepository) {}
  async execute(
    id: number,
    data: UpdateMasterDataProgressDTO,
  ): Promise<MasterDataProgressResponseDTO> {
    const result = await this.repo.update(id, data);
    return MasterDataProgressMapper.toDomain(result);
  }
}

export class GetMasterDataProgressByIdUseCase {
  constructor(private readonly repo: IMasterDataProgressRepository) {}
  async execute(id: number): Promise<MasterDataProgressResponseDTO> {
    const result = await this.repo.findById(id);
    if (!result) throw new NotFoundError("Data progress tidak ditemukan");
    return MasterDataProgressMapper.toDomain(result);
  }
}

export class GetMasterDataProgressBySprIdUseCase {
  constructor(private readonly repo: IMasterDataProgressRepository) {}
  async execute(sprId: number): Promise<MasterDataProgressResponseDTO> {
    const result = await this.repo.findBySprId(sprId);
    if (!result)
      throw new NotFoundError("Data progress untuk SPR ini belum dibuat");
    return MasterDataProgressMapper.toDomain(result);
  }
}

export class GetMasterDataProgressPaginatedUseCase {
  constructor(private readonly repo: IMasterDataProgressRepository) {}
  async execute(
    limit: number,
    cursor?: number,
    filters?: MasterDataProgressFilterDTO,
  ): Promise<CursorPaginatedData<MasterDataProgressResponseDTO>> {
    const result = await this.repo.findWithCursorPagination(
      limit,
      cursor,
      filters,
    );
    return {
      items: result.items.map((item) =>
        MasterDataProgressMapper.toDomain(item),
      ),
      meta: result.meta,
    };
  }
}
