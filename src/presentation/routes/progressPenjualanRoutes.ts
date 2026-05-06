import { Router } from "express";
import { authenticate, requireRole } from "../../middlewares/authMiddleware.js";
import { validate } from "../../middlewares/validate.js";
import { upload } from "../../middlewares/upload.js";
import {
  getProgressPenjualanSchema,
  updateProgressPenjualanSchema,
  uploadProgressDocumentSchema,
} from "../../validations/progressPenjualanSchema.js";
import type { ProgressPenjualanController } from "../controllers/progressPenjualanController.js";
export const createProgressPenjualanRoutes = (
  controller: ProgressPenjualanController,
): Router => {
  const router = Router();
  router.use(authenticate);
  router.get(
    "/:id",
    requireRole(["ADMIN", "MARKETING"]),
    validate(getProgressPenjualanSchema),
    controller.getByPenjualanId,
  );
  router.patch(
    "/:id",
    requireRole(["ADMIN", "MARKETING"]),
    validate(updateProgressPenjualanSchema),
    controller.update,
  );
  router.patch(
    "/:id/upload/:docType",
    requireRole(["ADMIN", "MARKETING"]),
    upload.single("file"),
    validate(uploadProgressDocumentSchema),
    controller.uploadDocument,
  );
  return router;
};
