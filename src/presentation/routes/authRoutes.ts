import { Router } from "express";
import { validate } from "../../middlewares/validate";
import { authenticate } from "../../middlewares/authMiddleware";
import { registerSchema, loginSchema } from "../../validations/authSchema";
import type { AuthController } from "../controllers/authController";

export const createAuthRoutes = (authController: AuthController): Router => {
  const router = Router();

  router.post("/register", validate(registerSchema), authController.register);

  router.post("/login", validate(loginSchema), authController.login);

  router.get("/profile", authenticate, authController.getProfile);

  return router;
};
