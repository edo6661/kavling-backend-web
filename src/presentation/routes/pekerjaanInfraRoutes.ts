import { Router } from "express";
import {
  authenticate,
  requirePermission,
} from "../../middlewares/authMiddleware.js";
import { validate } from "../../middlewares/validate.js";
import {
  createPekerjaanInfraSchema,
  updatePekerjaanInfraSchema,
} from "../../validations/pekerjaanInfraSchema.js";
import type { PekerjaanInfraController } from "../controllers/pekerjaanInfraController.js";

export const createPekerjaanInfraRoutes = (
  controller: PekerjaanInfraController,
): Router => {
  const router = Router();

  router.use(authenticate);

  router.get("/", requirePermission("SPK", "read"), controller.getList);

  router.post(
    "/",
    requirePermission("SPK", "create"),
    validate(createPekerjaanInfraSchema),
    controller.create,
  );

  router.patch(
    "/:id",
    requirePermission("SPK", "update"),
    validate(updatePekerjaanInfraSchema),
    controller.update,
  );

  router.delete(
    "/:id",
    requirePermission("SPK", "delete"),
    validate({ params: updatePekerjaanInfraSchema.params }),
    controller.delete,
  );

  return router;
};
