import type { Notification, Prisma } from "@prisma/client";
import type { NotificationEntity } from "../../domain/entities/Notification.js";

export class NotificationMapper {
  static toDomain(row: Notification): NotificationEntity {
    return {
      id: row.id,
      userId: row.userId,
      type: row.type,
      title: row.title,
      message: row.message,
      data:
        row.data && typeof row.data === "object" && !Array.isArray(row.data)
          ? (row.data as Record<string, unknown>)
          : null,
      linkPath: row.linkPath,
      isRead: row.isRead,
      createdAt: row.createdAt,
    };
  }

  static toCreateInput(
    data: import("../../domain/dtos/NotificationDTO.js").CreateNotificationDTO,
  ): Prisma.NotificationCreateInput {
    return {
      user: { connect: { id: data.userId } },
      type: data.type,
      title: data.title,
      message: data.message,
      data: data.data ?? undefined,
      linkPath: data.linkPath ?? null,
    };
  }
}
