import { Router } from "express";
import {
  authenticate,
  requirePermission,
} from "../../middlewares/authMiddleware.js";
import { validate } from "../../middlewares/validate.js";
import { upload } from "../../middlewares/upload.js";
import {
  getTukangListSchema,
  uploadTukangKtpSchema,
  upsertTukangSchema,
} from "../../validations/tukangSchema.js";
import type { TukangController } from "../controllers/tukangController.js";

export const createTukangRoutes = (controller: TukangController): Router => {
  const router = Router();

  router.use(authenticate);

  router.get(
    "/",
    requirePermission(["SPK", "PROGRESS_PROYEK"], "read"),
    validate(getTukangListSchema),
    controller.getList,
  );

  router.post(
    "/",
    requirePermission(["SPK", "PROGRESS_PROYEK"], "read"),
    validate(upsertTukangSchema),
    controller.upsert,
  );

  router.post(
    "/:nik/upload-ktp",
    requirePermission(["SPK", "PROGRESS_PROYEK"], "read"),
    upload.single("file"),
    validate(uploadTukangKtpSchema),
    controller.uploadKtp,
  );

  return router;
};
