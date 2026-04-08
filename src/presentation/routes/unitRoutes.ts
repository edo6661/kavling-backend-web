import { Router } from "express";
import { authenticate, requireRole } from "../../middlewares/authMiddleware.js";
import { validate } from "../../middlewares/validate.js";
import {
  createUnitSchema,
  updateUnitSchema,
  getUnitsPaginatedSchema,
} from "../../validations/unitSchema.js";
import type { UnitController } from "../controllers/unitController.js";

export const createUnitRoutes = (unitController: UnitController): Router => {
  const router = Router();

  router.use(authenticate);

  router.post(
    "/",
    requireRole(["ADMIN", "MARKETING"]),
    validate(createUnitSchema),
    unitController.create,
  );

  router.get(
    "/",
    requireRole(["ADMIN", "MARKETING"]),
    validate(getUnitsPaginatedSchema),
    unitController.getPaginated,
  );
  router.get(
    "/export/excel",
    requireRole(["ADMIN", "MARKETING"]),
    unitController.exportExcel,
  );
  router.get(
    "/export/pdf",
    requireRole(["ADMIN", "MARKETING"]),
    unitController.exportPdf,
  );

  router.get(
    "/:id",
    requireRole(["ADMIN", "MARKETING"]),
    validate({ params: updateUnitSchema.params }),
    unitController.getById,
  );

  router.patch(
    "/:id",
    requireRole(["ADMIN", "MARKETING"]),
    validate(updateUnitSchema),
    unitController.update,
  );
  router.delete(
    "/:id",
    requireRole(["ADMIN"]),
    validate({ params: updateUnitSchema.params }),
    unitController.delete,
  );
  return router;
};
