import { Router } from "express";
import {
  authenticate,
  requirePermission,
  requireRole,
} from "../../middlewares/authMiddleware.js";
import { validate } from "../../middlewares/validate.js";
import {
  cancelPenjualanSchema,
  createPenjualanSchema,
  gantiKavlingSchema,
  getPenjualanPaginatedSchema,
  updatePenjualanSchema,
  updateBatalPenjualanSchema,
  uploadSignatureSchema,
  approveSchema,
  lunaskanBookingFeeSchema,
} from "../../validations/penjualanSchema.js";
import type { PenjualanController } from "../controllers/penjualanController.js";
import { upload } from "../../middlewares/upload.js";

export const createPenjualanRoutes = (
  controller: PenjualanController,
): Router => {
  const router = Router();

  router.use(authenticate);

  router.get(
    "/pengajuan-batal",
    requirePermission("BATAL_TRANSAKSI", "read"),
    controller.getPengajuanBatal,
  );
  router.get(
    "/pengajuan-ganti-kavling",
    requirePermission("GANTI_KAVLING", "read"),
    controller.getPengajuanGantiKavling,
  );

  router.post(
    "/pengajuan-batal/:id/approve",
    requirePermission("BATAL_TRANSAKSI", "update"),
    validate(approveSchema),
    controller.approveBatal,
  );
  router.post(
    "/pengajuan-ganti-kavling/:id/approve",
    requirePermission("GANTI_KAVLING", "update"),
    validate(approveSchema),
    controller.approveGantiKavling,
  );

  router.get(
    "/",
    requirePermission("PENJUALAN", "read"),
    validate(getPenjualanPaginatedSchema),
    controller.getPaginated,
  );
  router.post(
    "/",
    requirePermission("PENJUALAN", "create"),
    validate(createPenjualanSchema),
    controller.create,
  );

  router.patch(
    "/:id/cancel",
    requirePermission("PENJUALAN", "update"),
    validate(cancelPenjualanSchema),
    controller.cancel,
  );
  router.patch(
    "/:id/upload/:type",
    requirePermission("PENJUALAN", "update"),
    upload.single("fileBukti"),
    controller.uploadBukti,
  );
  router.post(
    "/:id/signature",
    requirePermission("PENJUALAN", "update"),
    validate(uploadSignatureSchema),
    controller.uploadSignature,
  );
  router.patch(
    "/:id/batal",
    requirePermission("BATAL_TRANSAKSI", "update"),
    validate(updateBatalPenjualanSchema),
    controller.updateBatal,
  );
  router.patch(
    "/:id",
    requirePermission("PENJUALAN", "update"),
    validate(updatePenjualanSchema),
    controller.update,
  );
  router.patch(
    "/:id/ganti-kavling",
    requirePermission("PENJUALAN", "update"),
    validate(gantiKavlingSchema),
    controller.gantiKavling,
  );
  router.post(
    "/:id/generate-spr",
    requirePermission("PENJUALAN", "update"),
    controller.regenerateSpr,
  );
  router.post(
    "/:id/lunaskan-booking-fee",
    requireRole(["SUPERADMIN", "FINANCE"]),
    validate(lunaskanBookingFeeSchema),
    controller.lunaskanBookingFee,
  );

  return router;
};
