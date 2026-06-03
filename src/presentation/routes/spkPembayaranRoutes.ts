import { Router, type RequestHandler } from "express";
import {
  authenticate,
  requirePermission,
} from "../../middlewares/authMiddleware.js";
import { validate } from "../../middlewares/validate.js";
import { upload } from "../../middlewares/upload.js";
import {
  addBuktiSpkPembayaranSchema,
  bayarSpkPembayaranSchema,
  createSpkPembayaranSchema,
  getSpkPembayaranBySpkSchema,
  getSpkPembayaranPaginatedSchema,
  removeBuktiSpkPembayaranSchema,
  setBsiCmsDilaporkanSchema,
  updateSpkKasbonSchema,
  updateSpkUpahSchema,
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
    controller.updateKasbon as unknown as RequestHandler,
  );

  router.patch(
    "/:id/upah",
    requirePermission("SPK", "update"),
    validate(updateSpkUpahSchema),
    controller.updateUpah as unknown as RequestHandler,
  );

  router.delete(
    "/:id",
    requirePermission("SPK", "update"),
    controller.deletePengurangan,
  );

  router.patch(
    "/:id/bayar",
    requirePermission("TAGIHAN", "update"),
    upload.array("buktiPembayaran", 10),
    validate(bayarSpkPembayaranSchema),
    controller.bayar,
  );

  router.patch(
    "/:id/bukti",
    requirePermission("TAGIHAN", "update"),
    upload.array("buktiPembayaran", 10),
    validate(addBuktiSpkPembayaranSchema),
    controller.addBukti as unknown as RequestHandler,
  );

  router.delete(
    "/:id/bukti",
    requirePermission("TAGIHAN", "update"),
    validate(removeBuktiSpkPembayaranSchema),
    controller.removeBukti as unknown as RequestHandler,
  );

  router.patch(
    "/bsi-cms-dilaporkan",
    requirePermission("TAGIHAN", "update"),
    validate(setBsiCmsDilaporkanSchema),
    controller.setBsiCmsDilaporkan,
  );

  return router;
};
