import { Router } from "express";
import {
  authenticate,
  requirePermission,
} from "../../middlewares/authMiddleware.js";
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
    requirePermission("PROGRESS_PENJUALAN", "read"),
    validate(getProgressPenjualanSchema),
    controller.getByPenjualanId,
  );

  router.patch(
    "/:id",
    requirePermission("PROGRESS_PENJUALAN", "update"),
    validate(updateProgressPenjualanSchema),
    controller.update,
  );

  router.patch(
    "/:id/upload/:docType",
    requirePermission("PROGRESS_PENJUALAN", "update"),
    upload.single("file"),
    validate(uploadProgressDocumentSchema),
    controller.uploadDocument,
  );

  router.delete(
    "/:id/upload/:docType",
    requirePermission("PROGRESS_PENJUALAN", "update"),
    validate(uploadProgressDocumentSchema),
    controller.deleteDocument,
  );

  return router;
};
