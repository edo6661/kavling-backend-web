import type { INotarisRepository } from "../../../domain/repositories/INotarisRepo.js";
import type {
  CreateNotarisDTO,
  UpdateNotarisDTO,
  NotarisFilterDTO,
} from "../../../domain/dtos/NotarisDTO.js";
import type { CursorPaginatedData } from "../../../types/response.js";
import { NotFoundError } from "../../../domain/errors/NotFoundError.js";
import type { NotarisEntity } from "../../../domain/entities/Notaris.js";

export class CreateNotarisUseCase {
  constructor(private readonly repo: INotarisRepository) {}
  async execute(data: CreateNotarisDTO): Promise<NotarisEntity> {
    return await this.repo.create(data);
  }
}

export class UpdateNotarisUseCase {
  constructor(private readonly repo: INotarisRepository) {}
  async execute(id: number, data: UpdateNotarisDTO): Promise<NotarisEntity> {
    return await this.repo.update(id, data);
  }
}

export class GetNotarisByIdUseCase {
  constructor(private readonly repo: INotarisRepository) {}
  async execute(id: number): Promise<NotarisEntity> {
    const result = await this.repo.findById(id);
    if (!result) throw new NotFoundError("Notaris tidak ditemukan");
    return result;
  }
}

export class GetNotarisPaginatedUseCase {
  constructor(private readonly repo: INotarisRepository) {}
  async execute(
    limit: number,
    cursor?: number,
    filters?: NotarisFilterDTO,
  ): Promise<CursorPaginatedData<NotarisEntity>> {
    return await this.repo.findWithCursorPagination(limit, cursor, filters);
  }
}

export class DeleteNotarisUseCase {
  constructor(private readonly repo: INotarisRepository) {}
  async execute(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}
