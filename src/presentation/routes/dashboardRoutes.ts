import { Router } from "express";
import {
  authenticate,
  requirePermission,
} from "../../middlewares/authMiddleware.js";
import type { DashboardController } from "../controllers/dashboardController.js";

export const createDashboardRoutes = (
  controller: DashboardController,
): Router => {
  const router = Router();

  router.use(authenticate);
  router.get(
    "/summary",
    requirePermission("DASHBOARD", "read"),
    controller.getSummary,
  );
  router.get(
    "/drilldown",
    requirePermission("DASHBOARD", "read"),
    controller.getDrilldown,
  );

  return router;
};
