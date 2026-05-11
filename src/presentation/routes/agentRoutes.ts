import { Router } from "express";

import {
  authenticate,
  requirePermission,
} from "../../middlewares/authMiddleware.js";
import { validate } from "../../middlewares/validate.js";
import {
  createAgentSchema,
  updateAgentSchema,
  getAgentsPaginatedSchema,
} from "../../validations/agentSchema.js";
import type { AgentController } from "../controllers/agentController.js";

export const createAgentRoutes = (controller: AgentController): Router => {
  const router = Router();

  router.use(authenticate);

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

  return router;
};
