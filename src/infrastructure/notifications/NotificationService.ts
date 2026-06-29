import type { Role, NotificationType } from "@prisma/client";
import type { CreateNotificationDTO } from "../../domain/dtos/NotificationDTO.js";
import type { NotificationEntity } from "../../domain/entities/Notification.js";
import type { INotificationRepository } from "../../domain/repositories/INotificationRepo.js";
import type { UserRepository } from "../../domain/repositories/userRepo.js";
import type { SocketService } from "../websocket/SocketService.js";
import type { TelegramNotifyService } from "../telegram/TelegramNotifyService.js";

export interface NotificationPayload {
  type: CreateNotificationDTO["type"];
  title: string;
  message: string;
  data?: Record<string, unknown>;
  linkPath?: string;
}

/** Notifikasi yang juga dikirim ke Telegram (TELEGRAM_NOTIFY_CHAT_IDS). */
const TELEGRAM_FINANCE_ALERT_TYPES = new Set<NotificationType>([
  "UPLOAD_BUKTI",
  "KODE_BILLING_PPH",
  "SPK_MENUNGGU_APPROVAL",
  "SPK_PENGAJUAN_BARU",
  "SPK_DISETUJUI",
  "AGENT_PENCAIRAN",
]);

export class NotificationService {
  constructor(
    private readonly notificationRepo: INotificationRepository,
    private readonly userRepo: UserRepository,
    private readonly socketService: SocketService,
    private readonly telegramNotifyService?: TelegramNotifyService,
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
    const notifications = await this.notifyUsers(userIds, payload);
    await this.maybeSendTelegramAlert(payload);
    return notifications;
  }

  private async maybeSendTelegramAlert(payload: NotificationPayload): Promise<void> {
    if (!TELEGRAM_FINANCE_ALERT_TYPES.has(payload.type) || !this.telegramNotifyService) {
      return;
    }

    try {
      if (!this.telegramNotifyService.isConfigured()) {
        console.warn(
          "Telegram notify dilewati: TELEGRAM_BOT_TOKEN atau TELEGRAM_NOTIFY_CHAT_IDS belum dikonfigurasi.",
        );
        return;
      }

      await this.telegramNotifyService.sendApprovalAlert(
        payload.title,
        payload.message,
        payload.linkPath,
      );
    } catch (error) {
      console.error("Gagal mengirim notifikasi Telegram:", error);
    }
  }
}
