import type { Prisma, PrismaClient } from "@prisma/client";
import type { IAuditLogRepository } from "./IAuditLogRepo.js";
import type {
  AuditLogResponseDTO,
  AuditLogFilterDTO,
} from "../dtos/AuditLogDTO.js";
import type { CursorPaginatedData } from "../../types/response.js";

export class AuditLogRepository implements IAuditLogRepository {
  constructor(private readonly db: PrismaClient) {}

  async findWithCursorPagination(
    limit: number,
    cursor?: number,
    filters?: AuditLogFilterDTO,
  ): Promise<CursorPaginatedData<AuditLogResponseDTO>> {
    const where: Prisma.AuditLogWhereInput = {};

    if (filters?.search) {
      where.OR = [
        { entityName: { contains: filters.search } },
        { entityId: { contains: filters.search } },
        { user: { username: { contains: filters.search } } },
      ];
    }

    const items = await this.db.auditLog.findMany({
      take: limit + 1,
      ...(cursor && { skip: 1, cursor: { id: cursor } }),
      where,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { username: true } } },
    });

    let hasNextPage = false;
    if (items.length > limit) {
      hasNextPage = true;
      items.pop();
    }

    const mappedItems: AuditLogResponseDTO[] = items.map((item) => ({
      id: item.id,
      entityName: item.entityName,
      entityId: item.entityId,
      action: item.action,
      changes: item.changes,
      userId: item.userId,
      username: item.user?.username ?? "System",
      createdAt: item.createdAt,
    }));

    return {
      items: mappedItems,
      meta: {
        nextCursor: hasNextPage ? (items.at(-1)?.id ?? null) : null,
        hasNextPage,
      },
    };
  }
}
