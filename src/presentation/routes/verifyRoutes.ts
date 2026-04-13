import { Router } from "express";
import {
  verifySchema,
  type VerifyController,
} from "../controllers/verifyController.js";
import { validate } from "../../middlewares/validate.js";
export const createVerifyRoutes = (controller: VerifyController): Router => {
  const router = Router();

  router.get("/:id", validate(verifySchema), controller.verify);

  return router;
};
