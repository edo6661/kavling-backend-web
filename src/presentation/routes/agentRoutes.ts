import { Router } from "express";

import {
  authenticate,
  requirePermission,
  requireRole,
} from "../../middlewares/authMiddleware.js";
import { validate } from "../../middlewares/validate.js";
import {
  createAgentSchema,
  updateAgentSchema,
  getAgentsPaginatedSchema,
  generateAgentAccountSchema,
} from "../../validations/agentSchema.js";
import type { AgentController } from "../controllers/agentController.js";
import { upload } from "../../middlewares/upload.js";

export const createAgentRoutes = (controller: AgentController): Router => {
  const router = Router();

  router.use(authenticate);

  // ==========================================
  // ROUTE PORTAL AGENT (SELF)
  // Pastikan rute "/me/..." berada di atas rute "/:id"
  // ==========================================
  router.get("/me/profile", requireRole(["AGENT"]), controller.getMyProfile);

  router.patch(
    "/me/upload/:docType",
    requireRole(["AGENT"]),
    upload.single("file"),
    controller.uploadMyDocument,
  );

  // ==========================================
  // ROUTE INTERNAL ADMIN
  // ==========================================
  router.post(
    "/",
    requirePermission("AGENT", "create"),
    validate(createAgentSchema),
    controller.create,
  );

  router.get(
    "/",
    requirePermission("AGENT", "read"),
    validate(getAgentsPaginatedSchema),
    controller.getPaginated,
  );

  router.get(
    "/:id",
    requirePermission("AGENT", "read"),
    validate({ params: updateAgentSchema.params }),
    controller.getById,
  );

  router.patch(
    "/:id",
    requirePermission("AGENT", "update"),
    validate(updateAgentSchema),
    controller.update,
  );

  router.delete(
    "/:id",
    requirePermission("AGENT", "delete"),
    validate({ params: updateAgentSchema.params }),
    controller.delete,
  );

  router.patch(
    "/:id/upload/:docType",
    requirePermission("AGENT", "update"),
    upload.single("file"),
    controller.uploadDocument,
  );

  router.post(
    "/:id/generate-account",
    requirePermission("AGENT", "update"),
    validate(generateAgentAccountSchema),
    controller.generateAccount,
  );

  return router;
};
