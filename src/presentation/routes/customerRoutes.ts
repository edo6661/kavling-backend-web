// src/presentation/routes/customerRoutes.ts
import { Router } from "express";
import {
  authenticate,
  requirePermission,
  requireRole,
} from "../../middlewares/authMiddleware.js";
import { validate } from "../../middlewares/validate.js";
import { upload } from "../../middlewares/upload.js";
import {
  createCustomerSchema,
  updateCustomerSchema,
  getCustomersPaginatedSchema,
} from "../../validations/customerSchema.js";
import type { CustomerController } from "../controllers/customerController.js";

export const createCustomerRoutes = (
  customerController: CustomerController,
): Router => {
  const router = Router();

  router.use(authenticate);

  // ==========================================
  // ROUTE PORTAL CUSTOMER (Harus Paling Atas!)
  // ==========================================
  router.get(
    "/me/dashboard",
    requireRole(["CUSTOMER"]),
    customerController.getMyDashboard,
  );

  router.patch(
    "/me/upload/:docType",
    requireRole(["CUSTOMER"]),
    upload.single("file"),
    customerController.uploadMyDocument,
  );

  router.patch(
    "/me/tagihan/:id/upload-bukti",
    requireRole(["CUSTOMER"]),
    upload.array("fileBukti", 10),
    customerController.uploadMyTagihan,
  );

  // ==========================================
  // ROUTE INTERNAL ADMIN (Bawah)
  // ==========================================
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
    requirePermission(["CUSTOMER", "CUSTOMER_DETAIL"], "read"),
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
    customerController.generateAccount,
  );

  return router;
};
