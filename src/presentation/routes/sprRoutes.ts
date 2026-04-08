import { Router } from "express";
import { authenticate, requireRole } from "../../middlewares/authMiddleware.js";
import { validate } from "../../middlewares/validate.js";
import { upload } from "../../middlewares/upload.js";
import {
  createSprSchema,
  updateSprSchema,
  getSprPaginatedSchema,
  cancelSprSchema,
  fastEntrySprSchema,
} from "../../validations/sprSchema.js";
import type { SprController } from "../controllers/SprController.1.js";

export const createSprRoutes = (controller: SprController): Router => {
  const router = Router();

  router.use(authenticate);

  router.post(
    "/",
    requireRole(["ADMIN", "MARKETING"]),
    validate(createSprSchema),
    controller.create,
  );

  router.get(
    "/",
    requireRole(["ADMIN", "MARKETING", "CUSTOMER"]),
    validate(getSprPaginatedSchema),
    controller.getPaginated,
  );

  router.get(
    "/export/excel",
    requireRole(["ADMIN", "MARKETING"]),
    controller.exportExcel,
  );

  router.get(
    "/export/pdf",
    requireRole(["ADMIN", "MARKETING"]),
    controller.exportPdfList,
  );

  router.get(
    "/:id",
    requireRole(["ADMIN", "MARKETING", "CUSTOMER"]),
    validate({ params: updateSprSchema.params }),
    controller.getById,
  );

  router.patch(
    "/:id",
    requireRole(["ADMIN", "MARKETING"]),
    validate(updateSprSchema),
    controller.update,
  );

  router.patch(
    "/:id/signature/:role",
    requireRole(["ADMIN", "MARKETING", "CUSTOMER"]),
    upload.single("file"),
    controller.uploadSignature,
  );

  router.delete(
    "/:id",
    requireRole(["ADMIN"]),
    validate({ params: updateSprSchema.params }),
    controller.delete,
  );
  router.get(
    "/:id/pdf",
    requireRole(["ADMIN", "MARKETING", "CUSTOMER"]),
    validate({ params: updateSprSchema.params }),
    controller.generatePdf,
  );
  router.patch(
    "/:id/cancel",
    requireRole(["ADMIN", "MARKETING"]),
    validate(cancelSprSchema),
    controller.cancel,
  );

  router.post(
    "/fast-entry",
    requireRole(["ADMIN", "MARKETING"]),
    upload.fields([
      { name: "fileKtp", maxCount: 1 },
      { name: "fileKk", maxCount: 1 },
      { name: "fileNpwp", maxCount: 1 },
      { name: "buktiTransferBookingFee", maxCount: 1 },
      { name: "buktiTransferClosingFee", maxCount: 1 },
      { name: "buktiTransferMarketingFee", maxCount: 1 },
    ]),
    validate(fastEntrySprSchema),
    controller.createFastEntry,
  );
  return router;
};
