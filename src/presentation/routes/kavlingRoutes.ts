import { Router } from "express";
import { authenticate, requireRole } from "../../middlewares/authMiddleware.js";
import { validate } from "../../middlewares/validate.js";
import {
  createKavlingSchema,
  updateKavlingSchema,
  getKavlingPaginatedSchema,
} from "../../validations/kavlingSchema.js";
import type { KavlingController } from "../controllers/kavlingController.js";

export const createKavlingRoutes = (controller: KavlingController): Router => {
  const router = Router();

  router.use(authenticate);

  router.post(
    "/",
    requireRole(["ADMIN", "MARKETING"]),
    validate(createKavlingSchema),
    controller.create,
  );

  router.get(
    "/",
    requireRole(["ADMIN", "MARKETING"]),
    validate(getKavlingPaginatedSchema),
    controller.getPaginated,
  );

  router.get(
    "/:id",
    requireRole(["ADMIN", "MARKETING"]),
    validate({ params: updateKavlingSchema.params }),
    controller.getById,
  );

  router.patch(
    "/:id",
    requireRole(["ADMIN"]),
    validate(updateKavlingSchema),
    controller.update,
  );

  router.delete(
    "/:id",
    requireRole(["ADMIN"]),
    validate({ params: updateKavlingSchema.params }),
    controller.delete,
  );

  return router;
};
