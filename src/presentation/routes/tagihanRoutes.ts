import { Router } from "express";
import {
  authenticate,
  requirePermission,
} from "../../middlewares/authMiddleware.js";
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
    requirePermission("TAGIHAN", "create"),
    validate(createTagihanSchema),
    controller.create,
  );
  router.get(
    "/",
    requirePermission("TAGIHAN", "read"),
    validate(getTagihansPaginatedSchema),
    controller.getPaginated,
  );
  router.get(
    "/:id",
    requirePermission("TAGIHAN", "read"),
    validate({ params: updateTagihanSchema.params }),
    controller.getById,
  );
  router.patch(
    "/:id",
    requirePermission("TAGIHAN", "update"),
    validate(updateTagihanSchema),
    controller.update,
  );
  router.delete(
    "/:id",
    requirePermission("TAGIHAN", "delete"),
    validate({ params: updateTagihanSchema.params }),
    controller.delete,
  );

  router.patch(
    "/:id/upload-bukti",
    requirePermission("TAGIHAN", "update"),
    upload.single("fileBukti"),
    controller.uploadBukti,
  );
  router.patch(
    "/:id/refund",
    requirePermission("TAGIHAN", "update"),
    upload.single("fileBuktiRefund"),
    controller.uploadBuktiRefund,
  );
  router.post(
    "/:id/signature",
    requirePermission("TAGIHAN", "update"),
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
