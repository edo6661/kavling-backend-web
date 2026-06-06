import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { sendResponse } from "../../utils/response.js";
import type {
  GetNotificationsUseCase,
  GetUnreadNotificationCountUseCase,
  MarkAllNotificationsAsReadUseCase,
  MarkNotificationAsReadUseCase,
} from "../../application/usecases/notification/NotificationUseCases.js";

export class NotificationController {
  constructor(
    private readonly getNotificationsUseCase: GetNotificationsUseCase,
    private readonly getUnreadCountUseCase: GetUnreadNotificationCountUseCase,
    private readonly markAsReadUseCase: MarkNotificationAsReadUseCase,
    private readonly markAllAsReadUseCase: MarkAllNotificationsAsReadUseCase,
  ) {}

  getList = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));

    const result = await this.getNotificationsUseCase.execute(userId, page, limit);
    sendResponse(res, StatusCodes.OK, "Notifikasi berhasil diambil", result);
  };

  getUnreadCount = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;
    const count = await this.getUnreadCountUseCase.execute(userId);
    sendResponse(res, StatusCodes.OK, "Jumlah notifikasi belum dibaca", { count });
  };

  markAsRead = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;
    const id = Number(req.params.id);
    const result = await this.markAsReadUseCase.execute(id, userId);
    sendResponse(res, StatusCodes.OK, "Notifikasi ditandai sudah dibaca", result);
  };

  markAllAsRead = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;
    const count = await this.markAllAsReadUseCase.execute(userId);
    sendResponse(res, StatusCodes.OK, "Semua notifikasi ditandai sudah dibaca", { count });
  };
}
