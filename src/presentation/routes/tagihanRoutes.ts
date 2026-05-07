import { Router } from "express";
import { authenticate, requireRole } from "../../middlewares/authMiddleware.js";
import { validate } from "../../middlewares/validate.js";
import { upload } from "../../middlewares/upload.js";
import {
  createTagihanSchema,
  updateTagihanSchema,
  getTagihansPaginatedSchema,
  uploadBuktiByNoTagihanSchema,
} from "../../validations/tagihanSchema.js";
import type { TagihanController } from "../controllers/tagihanController.js";
import { uploadSignatureSchema } from "../../validations/penjualanSchema.js";

export const createTagihanRoutes = (controller: TagihanController): Router => {
  const router = Router();

  router.use(authenticate);

  router.post(
    "/",
    requireRole(["ADMIN", "MARKETING"]),
    validate(createTagihanSchema),
    controller.create,
  );
  router.get(
    "/",
    requireRole(["ADMIN", "MARKETING"]),
    validate(getTagihansPaginatedSchema),
    controller.getPaginated,
  );
  router.get(
    "/:id",
    requireRole(["ADMIN", "MARKETING"]),
    validate({ params: updateTagihanSchema.params }),
    controller.getById,
  );
  router.patch(
    "/:id",
    requireRole(["ADMIN", "MARKETING"]),
    validate(updateTagihanSchema),
    controller.update,
  );
  router.delete(
    "/:id",
    requireRole(["ADMIN"]),
    validate({ params: updateTagihanSchema.params }),
    controller.delete,
  );

  router.patch(
    "/:id/upload-bukti",
    requireRole(["ADMIN", "MARKETING"]),
    upload.single("fileBukti"),
    controller.uploadBukti,
  );
  router.patch(
    "/:id/refund",
    requireRole(["ADMIN", "MARKETING"]),
    upload.single("fileBuktiRefund"),
    controller.uploadBuktiRefund,
  );
  router.post(
    "/:id/signature",
    requireRole(["ADMIN", "MARKETING"]),
    validate(uploadSignatureSchema),
    controller.uploadSignature,
  );
  router.patch(
    "/bot/upload-bukti/:noTagihan",
    upload.single("fileBukti"),
    validate(uploadBuktiByNoTagihanSchema),
    (req, res, next) => {
      const botSecret = req.headers["x-telegram-bot-secret"];
      if (botSecret !== process.env.TELEGRAM_BOT_SECRET) {
        res
          .status(401)
          .json({ success: false, message: "Unauthorized Bot API Key" });
        return;
      }
      next();
    },
    controller.uploadBuktiByNoTagihan,
  );
  return router;
};
