import { Router } from "express";
import {
  authenticate,
  requirePermission,
} from "../../middlewares/authMiddleware.js";
import { validate } from "../../middlewares/validate.js";
import {
  createZonaSchema,
  updateZonaSchema,
  getZonaListSchema,
} from "../../validations/zonaSchema.js";
import type { ZonaController } from "../controllers/zonaController.js";

export const createZonaRoutes = (controller: ZonaController): Router => {
  const router = Router();

  router.use(authenticate);

  router.get(
    "/",
    requirePermission("SPK", "read"),
    validate(getZonaListSchema),
    controller.getList,
  );

  router.post(
    "/",
    requirePermission("SPK", "create"),
    validate(createZonaSchema),
    controller.create,
  );

  router.get(
    "/:id",
    requirePermission("SPK", "read"),
    validate({ params: updateZonaSchema.params }),
    controller.getById,
  );

  router.patch(
    "/:id",
    requirePermission("SPK", "update"),
    validate(updateZonaSchema),
    controller.update,
  );

  router.delete(
    "/:id",
    requirePermission("SPK", "delete"),
    validate({ params: updateZonaSchema.params }),
    controller.delete,
  );

  return router;
};
