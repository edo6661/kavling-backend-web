import { Router } from "express";
import { authenticate, requireRole } from "../../middlewares/authMiddleware.js";
import { validate } from "../../middlewares/validate.js";
import {
  createMasterDataProgressSchema,
  updateMasterDataProgressSchema,
  getMasterDataProgressPaginatedSchema,
} from "../../validations/masterDataProgressSchema.js";
import type { MasterDataProgressController } from "../controllers/masterDataProgressController.js";
import { upload } from "../../middlewares/upload.js";

export const createMasterDataProgressRoutes = (
  controller: MasterDataProgressController,
): Router => {
  const router = Router();

  router.use(authenticate);

  router.post(
    "/",
    requireRole(["ADMIN", "MARKETING"]),
    validate(createMasterDataProgressSchema),
    controller.create,
  );

  router.get(
    "/",
    requireRole(["ADMIN", "MARKETING"]),
    validate(getMasterDataProgressPaginatedSchema),
    controller.getPaginated,
  );

  router.get(
    "/spr/:id",
    requireRole(["ADMIN", "MARKETING", "CUSTOMER"]),
    controller.getBySprId,
  );

  router.get(
    "/:id",
    requireRole(["ADMIN", "MARKETING"]),
    validate({ params: updateMasterDataProgressSchema.params }),
    controller.getById,
  );

  router.patch(
    "/:id",
    requireRole(["ADMIN", "MARKETING"]),
    validate(updateMasterDataProgressSchema),
    controller.update,
  );
  router.patch(
    "/:id/upload/:docType",
    requireRole(["ADMIN", "MARKETING"]),
    upload.single("file"),
    controller.uploadDocument,
  );
  router.get(
    "/export/excel",
    requireRole(["ADMIN", "MARKETING"]),
    controller.exportExcel,
  );
  router.get(
    "/export/pdf",
    requireRole(["ADMIN", "MARKETING"]),
    controller.exportPdf,
  );

  return router;
};
