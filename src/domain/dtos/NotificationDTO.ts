import type { NotificationType } from "@prisma/client";

export interface CreateNotificationDTO {
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  linkPath?: string;
}
