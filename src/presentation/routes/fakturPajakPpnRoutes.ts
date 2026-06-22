import { Router } from "express";
import {
  authenticate,
  requirePermission,
} from "../../middlewares/authMiddleware.js";
import { validate } from "../../middlewares/validate.js";
import { upload } from "../../middlewares/upload.js";
import {
  uploadFakturPajakPpnSchema,
  fakturPajakPpnPenjualanParamsSchema,
  deleteFakturPajakPpnSchema,
} from "../../validations/fakturPajakPpnSchema.js";
import type { FakturPajakPpnController } from "../controllers/fakturPajakPpnController.js";

export const createFakturPajakPpnRoutes = (
  controller: FakturPajakPpnController,
): Router => {
  const router = Router();

  router.use(authenticate);

  router.post(
    "/upload",
    requirePermission("PROGRESS_PENJUALAN", "update"),
    upload.single("file"),
    validate(uploadFakturPajakPpnSchema),
    controller.upload,
  );

  router.get(
    "/penjualan/:penjualanId/all",
    requirePermission("PROGRESS_PENJUALAN", "read"),
    validate(fakturPajakPpnPenjualanParamsSchema),
    controller.getAllByPenjualan,
  );

  router.get(
    "/penjualan/:penjualanId",
    requirePermission("PROGRESS_PENJUALAN", "read"),
    validate(fakturPajakPpnPenjualanParamsSchema),
    controller.getByPenjualan,
  );

  router.delete(
    "/penjualan/:penjualanId",
    requirePermission("PROGRESS_PENJUALAN", "update"),
    validate(deleteFakturPajakPpnSchema),
    controller.deleteByPenjualan,
  );

  return router;
};
