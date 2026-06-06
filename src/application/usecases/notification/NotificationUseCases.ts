import type { INotificationRepository } from "../../../domain/repositories/INotificationRepo.js";
import type { NotificationEntity } from "../../../domain/entities/Notification.js";
import type { OffsetPaginatedData } from "../../../types/response.js";
import { NotFoundError } from "../../../domain/errors/NotFoundError.js";

export class GetNotificationsUseCase {
  constructor(private readonly notificationRepo: INotificationRepository) {}

  async execute(
    userId: number,
    page: number,
    limit: number,
  ): Promise<OffsetPaginatedData<NotificationEntity>> {
    return await this.notificationRepo.findByUserId(userId, page, limit);
  }
}

export class GetUnreadNotificationCountUseCase {
  constructor(private readonly notificationRepo: INotificationRepository) {}

  async execute(userId: number): Promise<number> {
    return await this.notificationRepo.countUnread(userId);
  }
}

export class MarkNotificationAsReadUseCase {
  constructor(private readonly notificationRepo: INotificationRepository) {}

  async execute(id: number, userId: number): Promise<NotificationEntity> {
    const updated = await this.notificationRepo.markAsRead(id, userId);
    if (!updated) throw new NotFoundError("Notifikasi tidak ditemukan.");
    return updated;
  }
}

export class MarkAllNotificationsAsReadUseCase {
  constructor(private readonly notificationRepo: INotificationRepository) {}

  async execute(userId: number): Promise<number> {
    return await this.notificationRepo.markAllAsRead(userId);
  }
}
