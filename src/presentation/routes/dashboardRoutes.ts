import { Router } from "express";
import { authenticate, requireRole } from "../../middlewares/authMiddleware.js";
import type { DashboardController } from "../controllers/dashboardController.js";

export const createDashboardRoutes = (
  controller: DashboardController,
): Router => {
  const router = Router();

  router.use(authenticate);
  router.get(
    "/summary",
    requireRole(["ADMIN", "MARKETING"]),
    controller.getSummary,
  );

  return router;
};
