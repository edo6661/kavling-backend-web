// src/application/usecases/spr/GetSprsPaginatedUseCase.ts
import type { ISprRepository } from "../../../domain/repositories/ISprRepo.js";
import type {
  SprFilterDTO,
  SprResponseDTO,
} from "../../../domain/dtos/SprDTO.js";
import type { CursorPaginatedData } from "../../../types/response.js";
import { SprMapper } from "../../../infrastructure/mapper/SprMapper.js";

export class GetSprsPaginatedUseCase {
  constructor(private readonly sprRepo: ISprRepository) {}

  async execute(
    limit: number,
    cursor?: number,
    filters?: SprFilterDTO,
  ): Promise<CursorPaginatedData<SprResponseDTO>> {
    const result = await this.sprRepo.findWithCursorPagination(
      limit,
      cursor,
      filters,
    );

    return {
      items: result.items.map((spr) => SprMapper.toDomain(spr)),
      meta: result.meta,
    };
  }
}
