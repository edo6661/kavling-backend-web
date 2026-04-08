import { Router } from "express";
import { authenticate, requireRole } from "../../middlewares/authMiddleware.js";
import { validate } from "../../middlewares/validate.js";
import {
  getUsersPaginatedSchema,
  updateUserSchema,
} from "../../validations/userSchema.js";
import type { UserController } from "../controllers/userController.js";

export const createUserRoutes = (userController: UserController): Router => {
  const router = Router();

  router.use(authenticate);

  router.get(
    "/",
    requireRole(["ADMIN"]),
    validate(getUsersPaginatedSchema),
    userController.getPaginated,
  );

  router.patch(
    "/:id",
    requireRole(["ADMIN"]),
    validate(updateUserSchema),
    userController.update,
  );

  return router;
};
