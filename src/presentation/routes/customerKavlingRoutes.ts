import { Router } from "express";
import {
  authenticate,
  requirePermission,
} from "../../middlewares/authMiddleware.js";
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
    requirePermission("CUSTOMER_KAVLING", "read"),
    validate(getCustomerKavlingsPaginatedSchema),
    controller.getPaginated,
  );

  router.patch(
    "/:id",
    requirePermission("CUSTOMER_KAVLING", "update"),
    validate(updateCustomerKavlingSchema),
    controller.update,
  );

  return router;
};
