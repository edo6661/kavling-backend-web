import type { IPenjualanRepository } from "../../../domain/repositories/IPenjualanRepo.js";
import type { PenjualanFilterDTO } from "../../../domain/dtos/PenjualanDTO.js";

export class GetPenjualanPaginatedUseCase {
  constructor(private readonly repo: IPenjualanRepository) {}

  async execute(
    page: number,
    limit: number,
    filters?: PenjualanFilterDTO & { status?: string },
  ) {
    return await this.repo.findWithOffsetPagination(page, limit, filters);
  }
}
