import { Router } from "express";
import { authenticate, requireRole } from "../../middlewares/authMiddleware.js";
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
    requireRole(["ADMIN"]),
    validate(createBankRekeningPtSchema),
    controller.create,
  );

  router.get(
    "/",
    requireRole(["ADMIN", "MARKETING"]),
    validate(getBankRekeningPtPaginatedSchema),
    controller.getPaginated,
  );

  router.get(
    "/:id",
    requireRole(["ADMIN", "MARKETING"]),
    validate({ params: updateBankRekeningPtSchema.params }),
    controller.getById,
  );

  router.patch(
    "/:id",
    requireRole(["ADMIN"]),
    validate(updateBankRekeningPtSchema),
    controller.update,
  );

  router.delete(
    "/:id",
    requireRole(["ADMIN"]),
    validate({ params: updateBankRekeningPtSchema.params }),
    controller.delete,
  );

  return router;
};
