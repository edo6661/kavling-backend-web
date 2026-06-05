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
  getSpkKasbonDraftSchema,
  getSpkPembayaranBySpkSchema,
  getSpkPembayaranPaginatedSchema,
  removeBuktiSpkPembayaranSchema,
  saveSpkKasbonDraftSchema,
  setBsiCmsDilaporkanSchema,
  submitSpkKasbonDraftSchema,
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

  router.get(
    "/spk/:spkId/kasbon-draft",
    requirePermission("SPK", "read"),
    validate(getSpkKasbonDraftSchema),
    controller.getKasbonDraft as unknown as RequestHandler,
  );

  router.put(
    "/spk/:spkId/kasbon-draft",
    requirePermission("SPK", "read"),
    validate(saveSpkKasbonDraftSchema),
    controller.saveKasbonDraft as unknown as RequestHandler,
  );

  router.post(
    "/spk/:spkId/kasbon-draft/submit",
    requirePermission("SPK", "read"),
    validate(submitSpkKasbonDraftSchema),
    controller.submitKasbonDraft as unknown as RequestHandler,
  );

  router.post(
    "/upload-foto-bon",
    requirePermission("SPK", "read"),
    upload.single("foto_bon"),
    controller.uploadFotoBon,
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
