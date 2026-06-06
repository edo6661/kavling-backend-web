import { Router } from "express";
import { authenticate } from "../../middlewares/authMiddleware.js";
import type { NotificationController } from "../controllers/notificationController.js";

export const createNotificationRoutes = (
  controller: NotificationController,
): Router => {
  const router = Router();

  router.use(authenticate);

  router.get("/", controller.getList);
  router.get("/unread-count", controller.getUnreadCount);
  router.patch("/read-all", controller.markAllAsRead);
  router.patch("/:id/read", controller.markAsRead);

  return router;
};
