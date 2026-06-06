import type { CreateNotificationDTO } from "../dtos/NotificationDTO.js";
import type { NotificationEntity } from "../entities/Notification.js";
import type { OffsetPaginatedData } from "../../types/response.js";

export interface INotificationRepository {
  create(data: CreateNotificationDTO): Promise<NotificationEntity>;
  createMany(data: CreateNotificationDTO[]): Promise<NotificationEntity[]>;
  findByUserId(
    userId: number,
    page: number,
    limit: number,
  ): Promise<OffsetPaginatedData<NotificationEntity>>;
  countUnread(userId: number): Promise<number>;
  markAsRead(id: number, userId: number): Promise<NotificationEntity | null>;
  markAllAsRead(userId: number): Promise<number>;
}
