import type { IBankRekeningPtRepository } from "../../../domain/repositories/IBankRekeningPtRepo.js";
import type {
  CreateBankRekeningPtDTO,
  UpdateBankRekeningPtDTO,
  BankRekeningPtFilterDTO,
  BankRekeningPtResponseDTO,
} from "../../../domain/dtos/BankRekeningPtDTO.js";
import type { CursorPaginatedData } from "../../../types/response.js";
import { NotFoundError } from "../../../domain/errors/NotFoundError.js";
import { BankRekeningPtMapper } from "../../../infrastructure/mapper/BankRekeningPtMapper.js";

export class CreateBankRekeningPtUseCase {
  constructor(private readonly repo: IBankRekeningPtRepository) {}
  async execute(
    data: CreateBankRekeningPtDTO,
  ): Promise<BankRekeningPtResponseDTO> {
    const result = await this.repo.create(data);
    return BankRekeningPtMapper.toDomain(result);
  }
}

export class UpdateBankRekeningPtUseCase {
  constructor(private readonly repo: IBankRekeningPtRepository) {}
  async execute(
    id: number,
    data: UpdateBankRekeningPtDTO,
  ): Promise<BankRekeningPtResponseDTO> {
    const result = await this.repo.update(id, data);
    return BankRekeningPtMapper.toDomain(result);
  }
}

export class GetBankRekeningPtByIdUseCase {
  constructor(private readonly repo: IBankRekeningPtRepository) {}
  async execute(id: number): Promise<BankRekeningPtResponseDTO> {
    const result = await this.repo.findById(id);
    if (!result) throw new NotFoundError("Rekening tidak ditemukan");
    return BankRekeningPtMapper.toDomain(result);
  }
}

export class GetBankRekeningPtPaginatedUseCase {
  constructor(private readonly repo: IBankRekeningPtRepository) {}
  async execute(
    limit: number,
    cursor?: number,
    filters?: BankRekeningPtFilterDTO,
  ): Promise<CursorPaginatedData<BankRekeningPtResponseDTO>> {
    const result = await this.repo.findWithCursorPagination(
      limit,
      cursor,
      filters,
    );
    const mappedItems = result.items.map((item) =>
      BankRekeningPtMapper.toDomain(item),
    );
    return {
      items: mappedItems,
      meta: result.meta,
    };
  }
}

export class DeleteBankRekeningPtUseCase {
  constructor(private readonly repo: IBankRekeningPtRepository) {}
  async execute(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}
