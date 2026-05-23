import { Router } from "express";
import {
  authenticate,
  requirePermission,
} from "../../middlewares/authMiddleware.js";
import { validate } from "../../middlewares/validate.js";
import { upload } from "../../middlewares/upload.js";
import {
  createSpkSchema,
  updateSpkSchema,
  getSpkPaginatedSchema,
  getSpkByIdSchema,
} from "../../validations/spkSchema.js";
import type { SpkController } from "../controllers/spkController.js";

export const createSpkRoutes = (controller: SpkController): Router => {
  const router = Router();

  router.use(authenticate);

  router.post(
    "/",
    requirePermission("SPK", "create"),
    upload.single("fileSpk"),
    validate(createSpkSchema),
    controller.create,
  );

  router.get(
    "/",
    requirePermission("SPK", "read"),
    validate(getSpkPaginatedSchema),
    controller.getPaginated,
  );

  router.get(
    "/:id",
    requirePermission("SPK", "read"),
    validate(getSpkByIdSchema),
    controller.getById,
  );

  router.patch(
    "/:id",
    requirePermission("SPK", "update"),
    upload.single("fileSpk"),
    validate(updateSpkSchema),
    controller.update,
  );

  router.delete(
    "/:id",
    requirePermission("SPK", "delete"),
    validate(getSpkByIdSchema),
    controller.delete,
  );

  return router;
};
