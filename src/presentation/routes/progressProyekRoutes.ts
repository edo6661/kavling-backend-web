import { Router } from "express";
import {
  authenticate,
  requirePermission,
} from "../../middlewares/authMiddleware.js";
import { validate } from "../../middlewares/validate.js";
import { upload } from "../../middlewares/upload.js";
import {
  getProgressProyekSchema,
  updateProgressProyekSchema,
  uploadTahapanPhotoSchema,
} from "../../validations/progressProyekSchema.js";
import type { ProgressProyekController } from "../controllers/progressProyekController.js";
import { addTahapanLogSchema } from "../../validations/progressPenjualanSchema.js";

export const createProgressProyekRoutes = (
  controller: ProgressProyekController,
): Router => {
  const router = Router();
  router.use(authenticate);

  router.get(
    "/:id",
    requirePermission("PROGRESS_PROYEK", "read"),
    validate(getProgressProyekSchema),
    controller.getByPenjualanId,
  );

  router.patch(
    "/:id",
    requirePermission("PROGRESS_PROYEK", "update"),
    validate(updateProgressProyekSchema),
    controller.update,
  );

  router.patch(
    "/:id/tahapan/:namaTahapan/foto",
    requirePermission("PROGRESS_PROYEK", "update"),
    upload.array("foto", 10),
    validate({ params: uploadTahapanPhotoSchema.params }),
    controller.uploadPhoto,
  );
  router.patch(
    "/:id/tahapan/log",
    requirePermission("PROGRESS_PROYEK", "update"),
    upload.array("foto", 10),
    validate(addTahapanLogSchema),
    controller.addLog,
  );

  return router;
};
