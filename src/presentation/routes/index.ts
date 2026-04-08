import { Router } from "express";
import { checkHealth } from "../controllers/healthController.js";
import { createAuthRoutes } from "./authRoutes.js";
import { createUserRoutes } from "./userRoutes.js";
import { createOcrRoutes } from "./ocrRoutes.js";
import { createUnitRoutes } from "./unitRoutes.js";
import { createBankRekeningPtRoutes } from "./bankRekeningPtRoutes.js";
import { createCustomerRoutes } from "./customerRoutes.js";
import { container } from "../../infrastructure/di/container.js";
import { createSprRoutes } from "./sprRoutes.js";
import { createSprPaymentRoutes } from "./sprPaymentRoutes.js";
import { createMasterDataProgressRoutes } from "./masterDataProgressRoutes.js";
import { createDashboardRoutes } from "./dashboardRoutes.js";
import { createPortalRoutes } from "./portalRoutes.js";
export const createMainRouter = (deps: typeof container): Router => {
  const router = Router();

  router.get("/health", checkHealth);
  router.use("/auth", createAuthRoutes(deps.authController));
  router.use("/users", createUserRoutes(deps.userController));
  router.use("/ocr", createOcrRoutes(deps.ocrController));

  router.use("/units", createUnitRoutes(deps.unitController));
  router.use(
    "/bank-rekening",
    createBankRekeningPtRoutes(deps.bankRekeningPtController),
  );

  router.use("/customers", createCustomerRoutes(deps.customerController));
  router.use("/spr", createSprRoutes(deps.sprController));
  router.use(
    "/spr-payments",
    createSprPaymentRoutes(deps.sprPaymentController),
  );
  router.use(
    "/progress",
    createMasterDataProgressRoutes(deps.masterDataProgressController),
  );
  router.use("/dashboard", createDashboardRoutes(deps.dashboardController));
  router.use("/portal", createPortalRoutes(deps.portalController));
  return router;
};

const router = createMainRouter(container);
export default router;
