import type { ITagihanRepository } from "../../../domain/repositories/ITagihanRepo.js";
import type {
  CreateTagihanDTO,
  UpdateTagihanDTO,
  TagihanFilterDTO,
  TagihanResponseDTO,
} from "../../../domain/dtos/TagihanDTO.js";
import type { CursorPaginatedData } from "../../../types/response.js";
import { NotFoundError } from "../../../domain/errors/NotFoundError.js";

export class CreateTagihanUseCase {
  constructor(private readonly repo: ITagihanRepository) {}
  async execute(data: CreateTagihanDTO): Promise<TagihanResponseDTO> {
    const count = await this.repo.count();
    const noTagihan = `INV-${String(count + 1).padStart(3, "0")}`;
    return await this.repo.create(data, noTagihan);
  }
}

export class UpdateTagihanUseCase {
  constructor(private readonly repo: ITagihanRepository) {}
  async execute(
    id: number,
    data: UpdateTagihanDTO,
  ): Promise<TagihanResponseDTO> {
    return await this.repo.update(id, data);
  }
}

export class GetTagihanByIdUseCase {
  constructor(private readonly repo: ITagihanRepository) {}
  async execute(id: number): Promise<TagihanResponseDTO> {
    const result = await this.repo.findById(id);
    if (!result) throw new NotFoundError("Tagihan tidak ditemukan");
    return result;
  }
}

export class GetTagihansPaginatedUseCase {
  constructor(private readonly repo: ITagihanRepository) {}
  async execute(
    limit: number,
    cursor?: number,
    filters?: TagihanFilterDTO,
  ): Promise<CursorPaginatedData<TagihanResponseDTO>> {
    return await this.repo.findWithCursorPagination(limit, cursor, filters);
  }
}

export class DeleteTagihanUseCase {
  constructor(private readonly repo: ITagihanRepository) {}
  async execute(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}
