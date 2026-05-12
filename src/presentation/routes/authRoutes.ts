import { Router } from "express";
import { validate } from "../../middlewares/validate";
import { authenticate } from "../../middlewares/authMiddleware";
import {
  registerSchema,
  loginSchema,
  updateSelfSchema,
} from "../../validations/authSchema";
import type { AuthController } from "../controllers/authController";

export const createAuthRoutes = (authController: AuthController): Router => {
  const router = Router();

  router.post("/register", validate(registerSchema), authController.register);

  router.post("/login", validate(loginSchema), authController.login);
  router.post(
    "/login/customer",
    validate(loginSchema),
    authController.loginCustomer,
  );
  router.post("/login/agent", validate(loginSchema), authController.loginAgent);

  router.get("/profile", authenticate, authController.getProfile);
  router.patch(
    "/update-me",
    authenticate,
    validate(updateSelfSchema),
    authController.updateSelf,
  );

  return router;
};
