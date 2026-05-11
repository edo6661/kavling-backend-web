import { Router } from "express";
import {
  authenticate,
  requirePermission,
} from "../../middlewares/authMiddleware.js";
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
    requirePermission("CUSTOMER", "create"),
    validate(createCustomerSchema),
    customerController.create,
  );

  router.get(
    "/",
    requirePermission("CUSTOMER", "read"),
    validate(getCustomersPaginatedSchema),
    customerController.getPaginated,
  );

  router.get(
    "/export/excel",
    requirePermission("CUSTOMER", "read"),
    customerController.exportExcel,
  );

  router.get(
    "/export/pdf",
    requirePermission("CUSTOMER", "read"),
    customerController.exportPdf,
  );

  router.get(
    "/:id",
    requirePermission("CUSTOMER", "read"),
    validate({ params: updateCustomerSchema.params }),
    customerController.getById,
  );

  router.patch(
    "/:id",
    requirePermission("CUSTOMER", "update"),
    validate(updateCustomerSchema),
    customerController.update,
  );

  router.patch(
    "/:id/upload/:docType",
    requirePermission("CUSTOMER", "update"),
    upload.single("file"),
    customerController.uploadDocument,
  );

  router.delete(
    "/:id",
    requirePermission("CUSTOMER", "delete"),
    validate({ params: updateCustomerSchema.params }),
    customerController.delete,
  );

  router.post(
    "/:id/generate-account",
    requirePermission("CUSTOMER", "update"),
    validate(generateAccountSchema),
    customerController.generateAccount,
  );
  return router;
};
