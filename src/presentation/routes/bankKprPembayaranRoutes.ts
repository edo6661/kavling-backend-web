import { Router } from "express";
import {
  authenticate,
  requirePermission,
} from "../../middlewares/authMiddleware.js";
import { validate } from "../../middlewares/validate.js";
import { upload } from "../../middlewares/upload.js";
import {
  bayarBankKprPembayaranSchema,
  getBankKprPembayaranPaginatedSchema,
  setBankKprBsiCmsDilaporkanSchema,
} from "../../validations/bankKprPembayaranSchema.js";
import type { BankKprPembayaranController } from "../controllers/bankKprPembayaranController.js";

export const createBankKprPembayaranRoutes = (
  controller: BankKprPembayaranController,
): Router => {
  const router = Router();

  router.use(authenticate);

  router.get(
    "/",
    requirePermission(["TAGIHAN", "PENJUALAN"], "read"),
    validate(getBankKprPembayaranPaginatedSchema),
    controller.getPaginated,
  );

  router.post(
    "/sync",
    requirePermission("TAGIHAN", "update"),
    controller.syncAll,
  );

  router.patch(
    "/:id/bayar",
    requirePermission("TAGIHAN", "update"),
    upload.single("buktiPembayaran"),
    validate(bayarBankKprPembayaranSchema),
    controller.bayar,
  );

  router.patch(
    "/bsi-cms-dilaporkan",
    requirePermission("TAGIHAN", "update"),
    validate(setBankKprBsiCmsDilaporkanSchema),
    controller.setBsiCmsDilaporkan,
  );

  return router;
};
