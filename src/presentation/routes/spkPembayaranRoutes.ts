import { Router, type RequestHandler } from "express";
import {
  authenticate,
  requirePermission,
} from "../../middlewares/authMiddleware.js";
import { validate } from "../../middlewares/validate.js";
import { upload } from "../../middlewares/upload.js";
import {
  bayarSpkPembayaranSchema,
  createSpkPembayaranSchema,
  getSpkPembayaranBySpkSchema,
  getSpkPembayaranPaginatedSchema,
} from "../../validations/spkPembayaranSchema.js";
import type { SpkPembayaranController } from "../controllers/spkPembayaranController.js";

export const createSpkPembayaranRoutes = (
  controller: SpkPembayaranController,
): Router => {
  const router = Router();

  router.use(authenticate);

  router.get(
    "/",
    requirePermission("TAGIHAN", "read"),
    validate(getSpkPembayaranPaginatedSchema),
    controller.getPaginated,
  );

  router.get(
    "/spk/:spkId",
    requirePermission("SPK", "read"),
    validate(getSpkPembayaranBySpkSchema),
    controller.getBySpk,
  );

  router.post(
    "/spk/:spkId",
    requirePermission("SPK", "read"),
    validate(createSpkPembayaranSchema),
    controller.createRequest as unknown as RequestHandler,
  );

  router.patch(
    "/:id/bayar",
    requirePermission("TAGIHAN", "update"),
    upload.single("buktiPembayaran"),
    validate(bayarSpkPembayaranSchema),
    controller.bayar,
  );

  return router;
};
