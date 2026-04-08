import { Router } from "express";
import { authenticate, requireRole } from "../../middlewares/authMiddleware.js";
import type { PortalController } from "../controllers/portalController.js";

export const createPortalRoutes = (controller: PortalController): Router => {
  const router = Router();

  router.use(authenticate);

  router.get(
    "/track-record",
    requireRole(["CUSTOMER"]),
    controller.getTrackRecord,
  );

  return router;
};
