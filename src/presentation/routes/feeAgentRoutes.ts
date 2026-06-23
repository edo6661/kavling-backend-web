import { Router } from "express";
import {
  authenticate,
  requirePermission,
  requireRole,
} from "../../middlewares/authMiddleware.js";
import { validate } from "../../middlewares/validate.js";
import { upload } from "../../middlewares/upload.js";
import {
  getFeeAgentsPaginatedSchema,
  updateFeeAgentSchema,
} from "../../validations/feeAgentSchema.js";
import type { FeeAgentController } from "../controllers/feeAgentController.js";

export const createFeeAgentRoutes = (
  controller: FeeAgentController,
): Router => {
  const router = Router();

  router.use(authenticate);

  router.get(
    "/",
    requirePermission("FEE_AGENT", "read"),
    validate(getFeeAgentsPaginatedSchema),
    controller.getPaginated,
  );

  router.post(
    "/backfill",
    requireRole(["SUPERADMIN"]),
    controller.backfill,
  );

  router.patch(
    "/:id",
    requirePermission("FEE_AGENT", "update"),
    validate(updateFeeAgentSchema),
    controller.update,
  );

  router.patch(
    "/:id/upload/:type",
    requirePermission("FEE_AGENT", "update"),
    upload.single("file"),
    controller.uploadBukti,
  );

  return router;
};
