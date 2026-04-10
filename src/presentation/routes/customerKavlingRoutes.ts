// src/presentation/routes/customerKavlingRoutes.ts
import { Router } from "express";
import { authenticate, requireRole } from "../../middlewares/authMiddleware.js";
import { validate } from "../../middlewares/validate.js";
import {
  getCustomerKavlingsPaginatedSchema,
  updateCustomerKavlingSchema,
} from "../../validations/customerKavlingSchema.js";
import type { CustomerKavlingController } from "../controllers/customerKavlingController.js";

export const createCustomerKavlingRoutes = (
  controller: CustomerKavlingController,
): Router => {
  const router = Router();

  router.use(authenticate);

  router.get(
    "/",
    requireRole(["ADMIN", "MARKETING"]),
    validate(getCustomerKavlingsPaginatedSchema),
    controller.getPaginated,
  );

  router.patch(
    "/:id",
    requireRole(["ADMIN"]),
    validate(updateCustomerKavlingSchema),
    controller.update,
  );

  return router;
};
