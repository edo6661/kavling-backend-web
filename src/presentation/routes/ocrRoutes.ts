import { Router } from "express";
import { authenticate } from "../../middlewares/authMiddleware.js";
import { upload } from "../../middlewares/upload.js";
import { validate } from "../../middlewares/validate.js";
import {
  ocrExtractSchema,
  ocrKasbonBonExtractSchema,
} from "../../validations/ocrSchema.js";
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

  router.post(
    "/extract-kasbon-bon",
    upload.single("foto_bon"),
    validate(ocrKasbonBonExtractSchema),
    controller.extractKasbonBon,
  );

  return router;
};
