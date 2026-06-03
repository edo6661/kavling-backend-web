import { Router } from "express";
import {
  authenticate,
  requirePermission,
  requireRole,
} from "../../middlewares/authMiddleware.js";
import { validate } from "../../middlewares/validate.js";
import { upload } from "../../middlewares/upload.js";
import {
  createTagihanSchema,
  updateTagihanSchema,
  getTagihansPaginatedSchema,
  removeBuktiTagihanSchema,
} from "../../validations/tagihanSchema.js";
import type { TagihanController } from "../controllers/tagihanController.js";
import { uploadSignatureSchema } from "../../validations/penjualanSchema.js";

export const createTagihanRoutes = (controller: TagihanController): Router => {
  const router = Router();

  router.use(authenticate);

  router.post(
    "/",
    requirePermission("TAGIHAN", "create"),
    validate(createTagihanSchema),
    controller.create,
  );
  router.get(
    "/",
    requirePermission("TAGIHAN", "read"),
    validate(getTagihansPaginatedSchema),
    controller.getPaginated,
  );
  router.get(
    "/:id",
    requirePermission("TAGIHAN", "read"),
    validate({ params: updateTagihanSchema.params }),
    controller.getById,
  );
  router.patch(
    "/:id",
    requirePermission("TAGIHAN", "update"),
    validate(updateTagihanSchema),
    controller.update,
  );
  router.delete(
    "/:id",
    requirePermission("TAGIHAN", "delete"),
    validate({ params: updateTagihanSchema.params }),
    controller.delete,
  );

  router.patch(
    "/:id/upload-bukti",
    requirePermission("TAGIHAN", "update"),
    upload.array("fileBukti", 10),
    controller.uploadBukti,
  );
  router.delete(
    "/:id/bukti",
    requirePermission("TAGIHAN", "update"),
    validate(removeBuktiTagihanSchema),
    controller.removeBukti,
  );
  router.patch(
    "/:id/refund",
    requirePermission("TAGIHAN", "update"),
    upload.single("fileBuktiRefund"),
    controller.uploadBuktiRefund,
  );
  router.post(
    "/:id/signature",
    requirePermission("TAGIHAN", "update"),
    validate(uploadSignatureSchema),
    controller.uploadSignature,
  );
  router.post(
    "/:id/approve",
    requireRole(["SUPERADMIN", "FINANCE"]),
    controller.approveBukti,
  );

  return router;
};
