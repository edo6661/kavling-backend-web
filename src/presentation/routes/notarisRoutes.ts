import { Router } from "express";
import {
  authenticate,
  requirePermission,
} from "../../middlewares/authMiddleware.js";
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
    requirePermission("NOTARIS", "create"),
    validate(createNotarisSchema),
    controller.create,
  );

  router.get(
    "/",
    requirePermission("NOTARIS", "read"),
    validate(getNotarisPaginatedSchema),
    controller.getPaginated,
  );

  router.get(
    "/:id",
    requirePermission("NOTARIS", "read"),
    validate({ params: updateNotarisSchema.params }),
    controller.getById,
  );

  router.patch(
    "/:id",
    requirePermission("NOTARIS", "update"),
    validate(updateNotarisSchema),
    controller.update,
  );

  router.delete(
    "/:id",
    requirePermission("NOTARIS", "delete"),
    validate({ params: updateNotarisSchema.params }),
    controller.delete,
  );

  return router;
};
