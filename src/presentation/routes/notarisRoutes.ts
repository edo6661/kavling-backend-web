import { Router } from "express";
import { authenticate, requireRole } from "../../middlewares/authMiddleware.js";
import { validate } from "../../middlewares/validate.js";
import {
  createNotarisSchema,
  updateNotarisSchema,
  getNotarisPaginatedSchema,
} from "../../validations/notarisSchema.js";
import type { NotarisController } from "../controllers/notarisController.js";

export const createNotarisRoutes = (controller: NotarisController): Router => {
  const router = Router();

  router.use(authenticate);

  router.post(
    "/",
    requireRole(["ADMIN", "MARKETING"]),
    validate(createNotarisSchema),
    controller.create,
  );

  router.get(
    "/",
    requireRole(["ADMIN", "MARKETING"]),
    validate(getNotarisPaginatedSchema),
    controller.getPaginated,
  );

  router.get(
    "/:id",
    requireRole(["ADMIN", "MARKETING"]),
    validate({ params: updateNotarisSchema.params }),
    controller.getById,
  );

  router.patch(
    "/:id",
    requireRole(["ADMIN"]),
    validate(updateNotarisSchema),
    controller.update,
  );

  router.delete(
    "/:id",
    requireRole(["ADMIN"]),
    validate({ params: updateNotarisSchema.params }),
    controller.delete,
  );

  return router;
};
