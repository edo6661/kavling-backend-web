import type { IAuditLogRepository } from "../../../domain/repositories/IAuditLogRepo.js";
import type { AuditLogFilterDTO } from "../../../domain/dtos/AuditLogDTO.js";

export class GetAuditLogsPaginatedUseCase {
  constructor(private readonly repo: IAuditLogRepository) {}

  async execute(limit: number, cursor?: number, filters?: AuditLogFilterDTO) {
    return await this.repo.findWithCursorPagination(limit, cursor, filters);
  }
}
