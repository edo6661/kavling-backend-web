import { Router } from "express";
import { authenticate, requireRole } from "../../middlewares/authMiddleware.js";
import { validate } from "../../middlewares/validate.js";
import {
  getUsersPaginatedSchema,
  updateUserSchema,
  createUserSchema,
  userIdParamSchema,
} from "../../validations/userSchema.js";
import type { UserController } from "../controllers/userController.js";

export const createUserRoutes = (userController: UserController): Router => {
  const router = Router();

  router.use(authenticate);

  router.post(
    "/",
    requireRole(["SUPERADMIN"]),
    validate(createUserSchema),
    userController.create,
  );

  router.get(
    "/",
    requireRole(["SUPERADMIN"]),
    validate(getUsersPaginatedSchema),
    userController.getPaginated,
  );

  router.get(
    "/:id",
    requireRole(["SUPERADMIN"]),
    validate({ params: userIdParamSchema }),
    userController.getById,
  );

  router.patch(
    "/:id",
    requireRole(["SUPERADMIN"]),
    validate(updateUserSchema),
    userController.update,
  );

  router.delete(
    "/:id",
    requireRole(["SUPERADMIN"]),
    validate({ params: userIdParamSchema }),
    userController.delete,
  );

  return router;
};
