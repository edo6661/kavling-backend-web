import type { IPenjualanRepository } from "../../../domain/repositories/IPenjualanRepo.js";
import type { PenjualanFilterDTO } from "../../../domain/dtos/PenjualanDTO.js";

export class GetPenjualanPaginatedUseCase {
  constructor(private readonly repo: IPenjualanRepository) {}

  async execute(limit: number, cursor?: number, filters?: PenjualanFilterDTO) {
    return await this.repo.findWithCursorPagination(limit, cursor, filters);
  }
}
