import { Router } from "express";
import {
  authenticate,
  requirePermission,
} from "../../middlewares/authMiddleware.js";
import { validate } from "../../middlewares/validate.js";
import {
  createKavlingSchema,
  updateKavlingSchema,
  getKavlingPaginatedSchema,
  getKavlingExportSchema,
  uploadKavlingDocumentSchema,
  uploadKavlingSertifikatTambahanSchema,
} from "../../validations/kavlingSchema.js";
import type { KavlingController } from "../controllers/kavlingController.js";
import { upload } from "../../middlewares/upload.js";

export const createKavlingRoutes = (controller: KavlingController): Router => {
  const router = Router();

  router.use(authenticate);

  router.post(
    "/",
    requirePermission("KAVLING", "create"),
    validate(createKavlingSchema),
    controller.create,
  );

  router.get(
    "/",
    requirePermission(["KAVLING", "SPK"], "read"),
    validate(getKavlingPaginatedSchema),
    controller.getPaginated,
  );

  router.get(
    "/export/excel",
    requirePermission("KAVLING", "read"),
    validate(getKavlingExportSchema),
    controller.exportExcel,
  );

  router.get(
    "/export/pengeluaran/excel",
    requirePermission(["KAVLING", "LAPORAN"], "read"),
    validate(getKavlingExportSchema),
    controller.exportPengeluaranExcel,
  );

  router.get(
    "/:id",
    requirePermission(["KAVLING", "SPK"], "read"),
    validate({ params: updateKavlingSchema.params }),
    controller.getById,
  );

  router.patch(
    "/:id",
    requirePermission("KAVLING", "update"),
    validate(updateKavlingSchema),
    controller.update,
  );

  router.delete(
    "/:id",
    requirePermission("KAVLING", "delete"),
    validate({ params: updateKavlingSchema.params }),
    controller.delete,
  );

  router.patch(
    "/:id/upload/:docType",
    requirePermission("KAVLING", "update"),
    upload.single("file"),
    validate(uploadKavlingDocumentSchema),
    controller.uploadDocument,
  );

  router.patch(
    "/:id/upload-tambahan/:urutan/:docType",
    requirePermission("KAVLING", "update"),
    upload.single("file"),
    validate(uploadKavlingSertifikatTambahanSchema),
    controller.uploadSertifikatTambahanDocument,
  );

  return router;
};
