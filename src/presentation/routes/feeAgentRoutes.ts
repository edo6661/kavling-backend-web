import { Router } from "express";
import { authenticate, requireRole } from "../../middlewares/authMiddleware.js";
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
    requireRole(["ADMIN", "MARKETING"]),
    validate(getFeeAgentsPaginatedSchema),
    controller.getPaginated,
  );

  router.patch(
    "/:id",
    requireRole(["ADMIN"]),
    validate(updateFeeAgentSchema),
    controller.update,
  );

  router.patch(
    "/:id/upload/:type",
    requireRole(["ADMIN"]),
    upload.single("file"),
    controller.uploadBukti,
  );

  return router;
};
