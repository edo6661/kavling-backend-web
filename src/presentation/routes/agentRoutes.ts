import { Router } from "express";
import { authenticate, requireRole } from "../../middlewares/authMiddleware.js";
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
    requireRole(["ADMIN", "MARKETING"]),
    validate(createAgentSchema),
    controller.create,
  );

  router.get(
    "/",
    requireRole(["ADMIN", "MARKETING"]),
    validate(getAgentsPaginatedSchema),
    controller.getPaginated,
  );

  router.get(
    "/:id",
    requireRole(["ADMIN", "MARKETING"]),
    validate({ params: updateAgentSchema.params }),
    controller.getById,
  );

  router.patch(
    "/:id",
    requireRole(["ADMIN"]),
    validate(updateAgentSchema),
    controller.update,
  );

  router.delete(
    "/:id",
    requireRole(["ADMIN"]),
    validate({ params: updateAgentSchema.params }),
    controller.delete,
  );

  return router;
};
