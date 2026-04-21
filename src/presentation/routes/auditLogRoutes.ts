import { Router } from "express";
import { authenticate, requireRole } from "../../middlewares/authMiddleware.js";
import { validate } from "../../middlewares/validate.js";
import { cursorPaginationQuerySchema } from "../../validations/paginationSchema.js";
import type { AuditLogController } from "../controllers/auditLogController.js";

export const createAuditLogRoutes = (
  controller: AuditLogController,
): Router => {
  const router = Router();
  router.use(authenticate);
  router.get(
    "/",
    requireRole(["ADMIN"]),
    validate({ query: cursorPaginationQuerySchema }),
    controller.getPaginated,
  );
  return router;
};
