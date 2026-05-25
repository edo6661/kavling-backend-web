import { Router } from "express";
import {
  authenticate,
  requirePermission,
} from "../../middlewares/authMiddleware.js";
import { validate } from "../../middlewares/validate.js";
import { upload } from "../../middlewares/upload.js";
import {
  uploadKodeBillingPphSchema,
  getKodeBillingPphPaginatedSchema,
  kodeBillingPphIdParamsSchema,
  kodeBillingPphPenjualanParamsSchema,
} from "../../validations/kodeBillingPphSchema.js";
import type { KodeBillingPphController } from "../controllers/kodeBillingPphController.js";

export const createKodeBillingPphRoutes = (
  controller: KodeBillingPphController,
): Router => {
  const router = Router();

  router.use(authenticate);

  router.post(
    "/upload",
    requirePermission("PROGRESS_PENJUALAN", "update"),
    upload.single("file"),
    validate(uploadKodeBillingPphSchema),
    controller.upload,
  );

  router.get(
    "/penjualan/:penjualanId",
    requirePermission("PROGRESS_PENJUALAN", "read"),
    validate(kodeBillingPphPenjualanParamsSchema),
    controller.getByPenjualan,
  );

  router.get(
    "/",
    requirePermission("TAGIHAN", "read"),
    validate(getKodeBillingPphPaginatedSchema),
    controller.getPaginated,
  );

  router.patch(
    "/:id/upload-bukti",
    requirePermission("TAGIHAN", "update"),
    validate(kodeBillingPphIdParamsSchema),
    upload.single("file"),
    controller.uploadBuktiBayar,
  );

  return router;
};
