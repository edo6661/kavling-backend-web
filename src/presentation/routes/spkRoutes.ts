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
  rejectSpkSchema,
} from "../../validations/spkSchema.js";
import type { SpkController } from "../controllers/spkController.js";

const spkDocumentUpload = upload.fields([
  { name: "fileSpk", maxCount: 1 },
  { name: "fileRab", maxCount: 1 },
]);

export const createSpkRoutes = (controller: SpkController): Router => {
  const router = Router();

  router.use(authenticate);

  router.post(
    "/",
    requirePermission("SPK", "create"),
    spkDocumentUpload,
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
    spkDocumentUpload,
    validate(updateSpkSchema),
    controller.update,
  );

  router.post(
    "/:id/approve",
    requirePermission("SPK", "update"),
    validate(getSpkByIdSchema),
    controller.approve,
  );

  router.post(
    "/:id/reject",
    requirePermission("SPK", "update"),
    validate({ ...getSpkByIdSchema, body: rejectSpkSchema.body }),
    controller.reject,
  );

  router.delete(
    "/:id",
    requirePermission("SPK", "delete"),
    validate(getSpkByIdSchema),
    controller.delete,
  );

  return router;
};
