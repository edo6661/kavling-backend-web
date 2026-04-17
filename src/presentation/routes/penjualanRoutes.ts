import { Router } from "express";
import { authenticate, requireRole } from "../../middlewares/authMiddleware.js";
import { validate } from "../../middlewares/validate.js";
import {
  cancelPenjualanSchema,
  createPenjualanSchema,
  gantiKavlingSchema,
  getPenjualanPaginatedSchema,
  updatePenjualanSchema,
  uploadSignatureSchema,
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
  router.post(
    "/:id/signature",
    requireRole(["ADMIN", "MARKETING"]),
    validate(uploadSignatureSchema),
    controller.uploadSignature,
  );
  router.patch(
    "/:id",
    requireRole(["ADMIN", "MARKETING"]),
    validate(updatePenjualanSchema),
    controller.update,
  );
  router.patch(
    "/:id/ganti-kavling",
    requireRole(["ADMIN", "MARKETING"]),
    validate(gantiKavlingSchema),
    controller.gantiKavling,
  );
  return router;
};
