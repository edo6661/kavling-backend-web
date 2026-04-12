import { Router } from "express";
import { authenticate, requireRole } from "../../middlewares/authMiddleware.js";
import { validate } from "../../middlewares/validate.js";
import {
  cancelPenjualanSchema,
  createPenjualanSchema,
  getPenjualanPaginatedSchema,
} from "../../validations/penjualanSchema.js";
import type { PenjualanController } from "../controllers/penjualanController.js";
import { upload } from "../../middlewares/upload.js";

export const createPenjualanRoutes = (
  controller: PenjualanController,
): Router => {
  const router = Router();

  router.use(authenticate);

  router.get(
    "/",
    requireRole(["ADMIN", "MARKETING"]),
    validate(getPenjualanPaginatedSchema),
    controller.getPaginated,
  );

  router.post(
    "/",
    requireRole(["ADMIN", "MARKETING"]),
    validate(createPenjualanSchema),
    controller.create,
  );
  router.patch(
    "/:id/cancel",
    requireRole(["ADMIN", "MARKETING"]),
    validate(cancelPenjualanSchema),
    controller.cancel,
  );
  router.patch(
    "/:id/upload/:type",
    requireRole(["ADMIN", "MARKETING"]),
    upload.single("fileBukti"),
    controller.uploadBukti,
  );
  return router;
};
