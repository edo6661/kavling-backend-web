import { Router } from "express";
import {
  authenticate,
  requirePermission,
} from "../../middlewares/authMiddleware.js";
import { validate } from "../../middlewares/validate.js";
import {
  createPerumahanSchema,
  updatePerumahanSchema,
  getPerumahanPaginatedSchema,
} from "../../validations/perumahanSchema.js";
import type { PerumahanController } from "../controllers/perumahanController.js";

export const createPerumahanRoutes = (
  controller: PerumahanController,
): Router => {
  const router = Router();

  router.get(
    "/",
    validate(getPerumahanPaginatedSchema),
    controller.getPaginated,
  );

  router.use(authenticate);

  router.post(
    "/",
    requirePermission("PERUMAHAN", "create"),
    validate(createPerumahanSchema),
    controller.create,
  );

  router.get(
    "/:id",
    requirePermission("PERUMAHAN", "read"),
    validate({ params: updatePerumahanSchema.params }),
    controller.getById,
  );

  router.patch(
    "/:id",
    requirePermission("PERUMAHAN", "update"),
    validate(updatePerumahanSchema),
    controller.update,
  );

  router.delete(
    "/:id",
    requirePermission("PERUMAHAN", "delete"),
    validate({ params: updatePerumahanSchema.params }),
    controller.delete,
  );

  return router;
};
