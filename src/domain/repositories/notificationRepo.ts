import type { PrismaClient } from "@prisma/client";
import type { CreateNotificationDTO } from "../dtos/NotificationDTO.js";
import type { NotificationEntity } from "../entities/Notification.js";
import type { INotificationRepository } from "./INotificationRepo.js";
import type { OffsetPaginatedData } from "../../types/response.js";
import { NotificationMapper } from "../../infrastructure/mapper/NotificationMapper.js";

export class NotificationRepository implements INotificationRepository {
  constructor(private readonly db: PrismaClient) {}

  async create(data: CreateNotificationDTO): Promise<NotificationEntity> {
    const row = await this.db.notification.create({
      data: NotificationMapper.toCreateInput(data),
    });
    return NotificationMapper.toDomain(row);
  }

  async createMany(data: CreateNotificationDTO[]): Promise<NotificationEntity[]> {
    if (!data.length) return [];

    const rows = await this.db.$transaction(
      data.map((item) =>
        this.db.notification.create({ data: NotificationMapper.toCreateInput(item) }),
      ),
    );
    return rows.map((row) => NotificationMapper.toDomain(row));
  }

  async findByUserId(
    userId: number,
    page: number,
    limit: number,
  ): Promise<OffsetPaginatedData<NotificationEntity>> {
    const skip = (page - 1) * limit;
    const [rows, totalItems] = await Promise.all([
      this.db.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.db.notification.count({ where: { userId } }),
    ]);

    const totalPages = Math.ceil(totalItems / limit) || 1;
    return {
      items: rows.map((row) => NotificationMapper.toDomain(row)),
      meta: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  async countUnread(userId: number): Promise<number> {
    return await this.db.notification.count({
      where: { userId, isRead: false },
    });
  }

  async markAsRead(id: number, userId: number): Promise<NotificationEntity | null> {
    const existing = await this.db.notification.findFirst({
      where: { id, userId },
    });
    if (!existing) return null;

    const row = await this.db.notification.update({
      where: { id },
      data: { isRead: true },
    });
    return NotificationMapper.toDomain(row);
  }

  async markAllAsRead(userId: number): Promise<number> {
    const result = await this.db.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return result.count;
  }
}
