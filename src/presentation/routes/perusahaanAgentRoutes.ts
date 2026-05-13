import { Router } from "express";
import {
  authenticate,
  requirePermission,
} from "../../middlewares/authMiddleware.js";
import { validate } from "../../middlewares/validate.js";
import { upload } from "../../middlewares/upload.js";
import {
  createPerusahaanAgentSchema,
  updatePerusahaanAgentSchema,
  getPerusahaanAgentPaginatedSchema,
} from "../../validations/perusahaanAgentSchema.js";
import type { PerusahaanAgentController } from "../controllers/perusahaanAgentController.js";

export const createPerusahaanAgentRoutes = (
  controller: PerusahaanAgentController,
): Router => {
  const router = Router();

  router.get(
    "/",
    validate(getPerusahaanAgentPaginatedSchema),
    controller.getPaginated,
  );

  router.use(authenticate);

  router.post(
    "/",
    requirePermission("AGENT", "create"),
    validate(createPerusahaanAgentSchema),
    controller.create,
  );
  router.patch(
    "/:id",
    requirePermission("AGENT", "update"),
    validate(updatePerusahaanAgentSchema),
    controller.update,
  );
  router.delete(
    "/:id",
    requirePermission("AGENT", "delete"),
    validate({ params: updatePerusahaanAgentSchema.params }),
    controller.delete,
  );

  router.patch(
    "/:id/upload-akte",
    requirePermission("AGENT", "update"),
    upload.single("file"),
    controller.uploadAkte,
  );

  return router;
};
