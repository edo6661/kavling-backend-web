import { Router } from "express";
import { authenticate, requireRole } from "../../middlewares/authMiddleware.js";
import { validate } from "../../middlewares/validate.js";
import {
  createPerumahanSchema,
  updatePerumahanSchema,
  getPerumahanPaginatedSchema,
} from "../../validations/perumahanSchema.js";
import type { PerumahanController } from "../controllers/perumahanController.js";

export const createPerumahanRoutes = (
  controller: PerumahanController,
): Router => {
  const router = Router();

  // 1. Pindahkan endpoint GET / ke atas SEBELUM middleware authenticate
  // agar bisa diakses oleh halaman Login secara publik.
  router.get(
    "/",
    validate(getPerumahanPaginatedSchema),
    controller.getPaginated,
  );

  // 2. Aktifkan perlindungan token untuk semua route di bawah ini
  router.use(authenticate);

  router.post(
    "/",
    requireRole(["ADMIN"]),
    validate(createPerumahanSchema),
    controller.create,
  );

  router.get(
    "/:id",
    requireRole(["ADMIN", "MARKETING"]),
    validate({ params: updatePerumahanSchema.params }),
    controller.getById,
  );

  router.patch(
    "/:id",
    requireRole(["ADMIN"]),
    validate(updatePerumahanSchema),
    controller.update,
  );

  router.delete(
    "/:id",
    requireRole(["ADMIN"]),
    validate({ params: updatePerumahanSchema.params }),
    controller.delete,
  );

  return router;
};
