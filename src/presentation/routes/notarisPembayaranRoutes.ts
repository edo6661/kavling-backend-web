import { Router } from "express";
import {
  authenticate,
  requirePermission,
} from "../../middlewares/authMiddleware.js";
import { validate } from "../../middlewares/validate.js";
import { upload } from "../../middlewares/upload.js";
import {
  bayarNotarisPembayaranSchema,
  getNotarisPembayaranPaginatedSchema,
  setNotarisBsiCmsDilaporkanSchema,
} from "../../validations/notarisPembayaranSchema.js";
import type { NotarisPembayaranController } from "../controllers/notarisPembayaranController.js";

export const createNotarisPembayaranRoutes = (
  controller: NotarisPembayaranController,
): Router => {
  const router = Router();

  router.use(authenticate);

  router.get(
    "/",
    requirePermission(["TAGIHAN", "NOTARIS"], "read"),
    validate(getNotarisPembayaranPaginatedSchema),
    controller.getPaginated,
  );

  router.patch(
    "/:id/bayar",
    requirePermission("TAGIHAN", "update"),
    upload.single("buktiPembayaran"),
    validate(bayarNotarisPembayaranSchema),
    controller.bayar,
  );

  router.patch(
    "/bsi-cms-dilaporkan",
    requirePermission("TAGIHAN", "update"),
    validate(setNotarisBsiCmsDilaporkanSchema),
    controller.setBsiCmsDilaporkan,
  );

  return router;
};
