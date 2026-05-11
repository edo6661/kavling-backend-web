import { Router } from "express";
import {
  authenticate,
  requirePermission,
} from "../../middlewares/authMiddleware.js";
import { validate } from "../../middlewares/validate.js";
import {
  createBankRekeningPtSchema,
  updateBankRekeningPtSchema,
  getBankRekeningPtPaginatedSchema,
} from "../../validations/bankRekeningPtSchema.js";
import type { BankRekeningPtController } from "../controllers/bankRekeningPtController.js";

export const createBankRekeningPtRoutes = (
  controller: BankRekeningPtController,
): Router => {
  const router = Router();

  router.use(authenticate);

  router.post(
    "/",
    requirePermission("BANK", "create"),
    validate(createBankRekeningPtSchema),
    controller.create,
  );

  router.get(
    "/",
    requirePermission("BANK", "read"),
    validate(getBankRekeningPtPaginatedSchema),
    controller.getPaginated,
  );

  router.get(
    "/:id",
    requirePermission("BANK", "read"),
    validate({ params: updateBankRekeningPtSchema.params }),
    controller.getById,
  );

  router.patch(
    "/:id",
    requirePermission("BANK", "update"),
    validate(updateBankRekeningPtSchema),
    controller.update,
  );

  router.delete(
    "/:id",
    requirePermission("BANK", "delete"),
    validate({ params: updateBankRekeningPtSchema.params }),
    controller.delete,
  );

  return router;
};
