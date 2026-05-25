import { Router } from "express";
import { checkHealth } from "../controllers/healthController.js";
import { createAuthRoutes } from "./authRoutes.js";
import { createUserRoutes } from "./userRoutes.js";
import { createOcrRoutes } from "./ocrRoutes.js";
import { createBankRekeningPtRoutes } from "./bankRekeningPtRoutes.js";
import { createCustomerRoutes } from "./customerRoutes.js";
import { container } from "../../infrastructure/di/container.js";
import { createPerumahanRoutes } from "./perumahanRoutes.js";
import { createDashboardRoutes } from "./dashboardRoutes.js";
import { createAgentRoutes } from "./agentRoutes.js";
import { createNotarisRoutes } from "./notarisRoutes.js";
import { createKavlingRoutes } from "./kavlingRoutes.js";
import { createCustomerKavlingRoutes } from "./customerKavlingRoutes.js";
import { createTagihanRoutes } from "./tagihanRoutes.js";
import { createPenjualanRoutes } from "./penjualanRoutes.js";
import { createFeeAgentRoutes } from "./feeAgentRoutes.js";
import { createVerifyRoutes } from "./verifyRoutes.js";
import { createAuditLogRoutes } from "./auditLogRoutes.js";
import { createProgressPenjualanRoutes } from "./progressPenjualanRoutes.js";
import { createRolePermissionRoutes } from "./rolePermissionRoutes.js";
import { createPerusahaanAgentRoutes } from "./perusahaanAgentRoutes.js";
import { createProgressProyekRoutes } from "./progressProyekRoutes.js";
import { createSpkRoutes } from "./spkRoutes.js";
import { createKodeBillingPphRoutes } from "./kodeBillingPphRoutes.js";
export const createMainRouter = (deps: typeof container): Router => {
  const router = Router();

  router.get("/health", checkHealth);
  router.use("/verify", createVerifyRoutes(deps.verifyController));

  router.use("/auth", createAuthRoutes(deps.authController));
  router.use("/users", createUserRoutes(deps.userController));
  router.use("/ocr", createOcrRoutes(deps.ocrController));

  router.use(
    "/bank-rekening",
    createBankRekeningPtRoutes(deps.bankRekeningPtController),
  );

  router.use("/customers", createCustomerRoutes(deps.customerController));
  router.use("/perumahan", createPerumahanRoutes(deps.perumahanController));
  router.use("/dashboard", createDashboardRoutes(deps.dashboardController));
  router.use("/agents", createAgentRoutes(deps.agentController));
  router.use("/notaris", createNotarisRoutes(deps.notarisController));
  router.use("/kavling", createKavlingRoutes(deps.kavlingController));
  router.use(
    "/customer-kavling",
    createCustomerKavlingRoutes(deps.customerKavlingController),
  );
  router.use("/tagihan", createTagihanRoutes(deps.tagihanController));
  router.use(
    "/kode-billing-pph",
    createKodeBillingPphRoutes(deps.kodeBillingPphController),
  );
  router.use("/penjualan", createPenjualanRoutes(deps.penjualanController));
  router.use(
    "/progress-penjualan",
    createProgressPenjualanRoutes(deps.progressPenjualanController),
  );
  router.use("/fee-agents", createFeeAgentRoutes(deps.feeAgentController));
  router.use("/audit-logs", createAuditLogRoutes(deps.auditLogController));
  router.use(
    "/role-permissions",
    createRolePermissionRoutes(deps.rolePermissionController),
  );
  router.use(
    "/perusahaan-agents",
    createPerusahaanAgentRoutes(deps.perusahaanAgentController),
  );
  router.use(
    "/progress-proyek",
    createProgressProyekRoutes(deps.progressProyekController),
  );
  router.use("/spk", createSpkRoutes(deps.spkController));
  return router;
};

const router = createMainRouter(container);
export default router;
