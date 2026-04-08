import { Router } from "express";
import { authenticate, requireRole } from "../../middlewares/authMiddleware.js";
import { validate } from "../../middlewares/validate.js";
import { upload } from "../../middlewares/upload.js";
import {
  createSprPaymentSchema,
  updateSprPaymentSchema,
  getSprPaymentPaginatedSchema,
  verifySprPaymentSchema,
} from "../../validations/sprPaymentSchema.js";
import type { SprPaymentController } from "../controllers/sprPaymentController.js";

export const createSprPaymentRoutes = (
  controller: SprPaymentController,
): Router => {
  const router = Router();

  router.use(authenticate);

  router.post(
    "/",
    requireRole(["ADMIN", "MARKETING"]),
    validate(createSprPaymentSchema),
    controller.create,
  );

  router.get(
    "/",
    requireRole(["ADMIN", "MARKETING", "CUSTOMER"]),
    validate(getSprPaymentPaginatedSchema),
    controller.getPaginated,
  );
  router.get(
    "/:id/kwitansi",
    requireRole(["ADMIN", "MARKETING", "CUSTOMER"]),
    controller.generateKwitansi,
  );
  router.get(
    "/export/finance",
    requireRole(["ADMIN", "MARKETING"]),
    controller.exportFinanceExcel,
  );

  router.get(
    "/:id",
    requireRole(["ADMIN", "MARKETING", "CUSTOMER"]),
    validate({ params: updateSprPaymentSchema.params }),
    controller.getById,
  );

  router.patch(
    "/:id",
    requireRole(["ADMIN", "MARKETING"]),
    validate(updateSprPaymentSchema),
    controller.update,
  );

  router.patch(
    "/:id/upload-bukti",
    requireRole(["ADMIN", "MARKETING"]),
    upload.single("bukti_transfer"),
    validate({ params: updateSprPaymentSchema.params }),
    controller.uploadBukti,
  );

  router.patch(
    "/:id/verify",
    requireRole(["ADMIN", "MARKETING"]),
    validate(verifySprPaymentSchema),
    controller.verify,
  );

  router.delete(
    "/:id",
    requireRole(["ADMIN", "MARKETING"]),
    validate({ params: updateSprPaymentSchema.params }),
    controller.delete,
  );

  return router;
};
