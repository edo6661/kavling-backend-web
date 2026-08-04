import { Router } from "express";
import { authenticate, requireRole } from "../../middlewares/authMiddleware.js";
import type { AdminExportController } from "../controllers/adminExportController.js";

export const createAdminExportRoutes = (
  controller: AdminExportController,
): Router => {
  const router = Router();

  router.use(authenticate);
  router.use(requireRole(["SUPERADMIN"]));

  router.get("/export/database/excel", controller.exportDatabaseExcel);

  return router;
};
