import { Router } from "express";
import {
  authenticate,
  requirePermission,
} from "../../middlewares/authMiddleware.js";
import { validate } from "../../middlewares/validate.js";
import {
  createKavlingSchema,
  updateKavlingSchema,
  getKavlingPaginatedSchema,
  uploadKavlingDocumentSchema,
} from "../../validations/kavlingSchema.js";
import type { KavlingController } from "../controllers/kavlingController.js";
import { upload } from "../../middlewares/upload.js";

export const createKavlingRoutes = (controller: KavlingController): Router => {
  const router = Router();

  router.use(authenticate);

  router.post(
    "/",
    requirePermission("KAVLING", "create"),
    validate(createKavlingSchema),
    controller.create,
  );

  router.get(
    "/",
    requirePermission("KAVLING", "read"),
    validate(getKavlingPaginatedSchema),
    controller.getPaginated,
  );

  router.get(
    "/:id",
    requirePermission("KAVLING", "read"),
    validate({ params: updateKavlingSchema.params }),
    controller.getById,
  );

  router.patch(
    "/:id",
    requirePermission("KAVLING", "update"),
    validate(updateKavlingSchema),
    controller.update,
  );

  router.delete(
    "/:id",
    requirePermission("KAVLING", "delete"),
    validate({ params: updateKavlingSchema.params }),
    controller.delete,
  );

  router.patch(
    "/:id/upload/:docType",
    requirePermission("KAVLING", "update"),
    upload.single("file"),
    validate(uploadKavlingDocumentSchema),
    controller.uploadDocument,
  );

  return router;
};
