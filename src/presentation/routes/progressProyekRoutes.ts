import { Router } from "express";
import {
  authenticate,
  requirePermission,
} from "../../middlewares/authMiddleware.js";
import { validate } from "../../middlewares/validate.js";
import { upload } from "../../middlewares/upload.js";
import {
  getProgressProyekListSchema,
  getProgressProyekByKavlingSchema,
  getProgressProyekSchema,
  updateProgressProyekSchema,
  addTahapanLogByKavlingSchema,
  uploadTahapanPhotoByKavlingSchema,
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
    "/mandors",
    requirePermission("PROGRESS_PROYEK", "read"),
    controller.listMandors,
  );

  router.get(
    "/proyek",
    requirePermission("PROGRESS_PROYEK", "read"),
    validate(getProgressProyekListSchema),
    controller.getProyekList,
  );

  router.get(
    "/kavling/:kavlingId",
    requirePermission("PROGRESS_PROYEK", "read"),
    validate(getProgressProyekByKavlingSchema),
    controller.getByKavlingId,
  );

  router.patch(
    "/kavling/:kavlingId/tahapan/:namaTahapan/foto",
    requirePermission("PROGRESS_PROYEK", "update"),
    upload.array("foto", 10),
    validate({ params: uploadTahapanPhotoByKavlingSchema.params }),
    controller.uploadPhotoByKavling,
  );

  router.patch(
    "/kavling/:kavlingId/tahapan/log",
    requirePermission("PROGRESS_PROYEK", "update"),
    upload.array("foto", 10),
    validate(addTahapanLogByKavlingSchema),
    controller.addLogByKavling,
  );

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
