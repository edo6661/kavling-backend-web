import { Router } from "express";
import { authenticate, requireRole } from "../../middlewares/authMiddleware.js";
import { validate } from "../../middlewares/validate.js";
import { upload } from "../../middlewares/upload.js";
import {
  createCustomerSchema,
  updateCustomerSchema,
  getCustomersPaginatedSchema,
  generateAccountSchema,
} from "../../validations/customerSchema.js";
import type { CustomerController } from "../controllers/customerController.js";

export const createCustomerRoutes = (
  customerController: CustomerController,
): Router => {
  const router = Router();

  router.use(authenticate);

  router.post(
    "/",
    requireRole(["ADMIN", "MARKETING"]),
    validate(createCustomerSchema),
    customerController.create,
  );

  router.get(
    "/",
    requireRole(["ADMIN", "MARKETING"]),
    validate(getCustomersPaginatedSchema),
    customerController.getPaginated,
  );

  router.get(
    "/export/excel",
    requireRole(["ADMIN", "MARKETING"]),
    customerController.exportExcel,
  );

  router.get(
    "/export/pdf",
    requireRole(["ADMIN", "MARKETING"]),
    customerController.exportPdf,
  );

  router.get(
    "/:id",
    requireRole(["ADMIN", "MARKETING"]),
    validate({ params: updateCustomerSchema.params }),
    customerController.getById,
  );

  router.patch(
    "/:id",
    requireRole(["ADMIN", "MARKETING"]),
    validate(updateCustomerSchema),
    customerController.update,
  );

  router.patch(
    "/:id/upload/:docType",
    requireRole(["ADMIN", "MARKETING"]),
    upload.single("file"),
    customerController.uploadDocument,
  );

  router.delete(
    "/:id",
    requireRole(["ADMIN"]),
    validate({ params: updateCustomerSchema.params }),
    customerController.delete,
  );
  router.post(
    "/:id/generate-account",
    requireRole(["ADMIN", "MARKETING"]),
    validate(generateAccountSchema),
    customerController.generateAccount,
  );
  return router;
};
