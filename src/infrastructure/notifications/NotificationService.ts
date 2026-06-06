import type { Role } from "@prisma/client";
import type { CreateNotificationDTO } from "../../domain/dtos/NotificationDTO.js";
import type { NotificationEntity } from "../../domain/entities/Notification.js";
import type { INotificationRepository } from "../../domain/repositories/INotificationRepo.js";
import type { UserRepository } from "../../domain/repositories/userRepo.js";
import type { SocketService } from "../websocket/SocketService.js";

export interface NotificationPayload {
  type: CreateNotificationDTO["type"];
  title: string;
  message: string;
  data?: Record<string, unknown>;
  linkPath?: string;
}

export class NotificationService {
  constructor(
    private readonly notificationRepo: INotificationRepository,
    private readonly userRepo: UserRepository,
    private readonly socketService: SocketService,
  ) {}

  async notifyUser(
    userId: number,
    payload: NotificationPayload,
  ): Promise<NotificationEntity> {
    const notification = await this.notificationRepo.create({
      userId,
      ...payload,
    });
    this.socketService.notifyUser(userId, "notifikasi", notification);
    return notification;
  }

  async notifyUsers(
    userIds: number[],
    payload: NotificationPayload,
  ): Promise<NotificationEntity[]> {
    const uniqueIds = [...new Set(userIds.filter((id) => id > 0))];
    if (!uniqueIds.length) return [];

    const dtos: CreateNotificationDTO[] = uniqueIds.map((userId) => ({
      userId,
      ...payload,
    }));

    const notifications = await this.notificationRepo.createMany(dtos);
    for (const notification of notifications) {
      this.socketService.notifyUser(notification.userId, "notifikasi", notification);
    }
    return notifications;
  }

  async notifyRoles(
    roles: Role[],
    payload: NotificationPayload,
  ): Promise<NotificationEntity[]> {
    const userIds: number[] = [];
    for (const role of roles) {
      const users = await this.userRepo.findByRole(role);
      userIds.push(...users.map((u) => u.id));
    }
    return await this.notifyUsers(userIds, payload);
  }
}
