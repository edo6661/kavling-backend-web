import type { CursorPaginatedData } from "../../types/response.js";
import type {
  AuditLogResponseDTO,
  AuditLogFilterDTO,
} from "../dtos/AuditLogDTO.js";

export interface IAuditLogRepository {
  findWithCursorPagination(
    limit: number,
    cursor?: number,
    filters?: AuditLogFilterDTO,
  ): Promise<CursorPaginatedData<AuditLogResponseDTO>>;
}
