import { Router } from "express";
import { authenticate } from "../../middlewares/authMiddleware.js";
import { upload } from "../../middlewares/upload.js";
import { validate } from "../../middlewares/validate.js";
import { ocrExtractSchema } from "../../validations/ocrSchema.js";
import type { OcrController } from "../controllers/ocrController.js";

export const createOcrRoutes = (controller: OcrController): Router => {
  const router = Router();

  router.use(authenticate);

  router.post(
    "/extract-ktp",
    upload.single("foto_ktp"),
    validate(ocrExtractSchema),
    controller.extractKtpData,
  );

  return router;
};
