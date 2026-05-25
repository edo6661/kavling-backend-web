import { Router } from "express";
import {
  authenticate,
  requirePermission,
} from "../../middlewares/authMiddleware.js";
import { validate } from "../../middlewares/validate.js";
import { upload } from "../../middlewares/upload.js";
import {
  uploadSuketPphSchema,
  suketPphPenjualanParamsSchema,
} from "../../validations/suketPphSchema.js";
import type { SuketPphController } from "../controllers/suketPphController.js";

export const createSuketPphRoutes = (controller: SuketPphController): Router => {
  const router = Router();

  router.use(authenticate);

  router.post(
    "/upload",
    requirePermission("PROGRESS_PENJUALAN", "update"),
    upload.single("file"),
    validate(uploadSuketPphSchema),
    controller.upload,
  );

  router.get(
    "/penjualan/:penjualanId",
    requirePermission("PROGRESS_PENJUALAN", "read"),
    validate(suketPphPenjualanParamsSchema),
    controller.getByPenjualan,
  );

  return router;
};
