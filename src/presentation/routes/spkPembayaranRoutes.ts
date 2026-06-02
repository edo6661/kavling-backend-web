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
  setBsiCmsDilaporkanSchema,
  updateSpkKasbonSchema,
} from "../../validations/spkPembayaranSchema.js";
import type { SpkPembayaranController } from "../controllers/spkPembayaranController.js";

export const createSpkPembayaranRoutes = (
  controller: SpkPembayaranController,
): Router => {
  const router = Router();

  router.use(authenticate);

  router.get(
    "/",
    requirePermission(["TAGIHAN", "SPK"], "read"),
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
    "/:id/kasbon",
    requirePermission("SPK", "update"),
    validate(updateSpkKasbonSchema),
    controller.updateKasbon,
  );

  router.patch(
    "/:id/bayar",
    requirePermission("TAGIHAN", "update"),
    upload.array("buktiPembayaran", 10),
    validate(bayarSpkPembayaranSchema),
    controller.bayar,
  );

  router.patch(
    "/bsi-cms-dilaporkan",
    requirePermission("TAGIHAN", "update"),
    validate(setBsiCmsDilaporkanSchema),
    controller.setBsiCmsDilaporkan,
  );

  return router;
};
