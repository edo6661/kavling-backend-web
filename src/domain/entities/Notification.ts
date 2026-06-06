import type { NotificationType } from "@prisma/client";

export interface NotificationEntity {
  id: number;
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  linkPath: string | null;
  isRead: boolean;
  createdAt: Date;
}
