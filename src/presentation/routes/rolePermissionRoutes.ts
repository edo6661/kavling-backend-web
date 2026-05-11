import { Router } from "express";
import { authenticate, requireRole } from "../../middlewares/authMiddleware.js";
import { validate } from "../../middlewares/validate.js";
import {
  upsertRolePermissionSchema,
  getRolePermissionsSchema,
  rolePermissionIdParamSchema,
} from "../../validations/rolePermissionSchema.js";
import type { RolePermissionController } from "../controllers/rolePermissionController.js";

export const createRolePermissionRoutes = (
  controller: RolePermissionController,
): Router => {
  const router = Router();

  router.use(authenticate);

  router.get(
    "/",
    requireRole(["SUPERADMIN"]),
    validate(getRolePermissionsSchema),
    controller.getAll,
  );

  router.post(
    "/upsert",
    requireRole(["SUPERADMIN"]),
    validate(upsertRolePermissionSchema),
    controller.upsert,
  );

  router.delete(
    "/:id",
    requireRole(["SUPERADMIN"]),
    validate(rolePermissionIdParamSchema),
    controller.delete,
  );

  return router;
};
