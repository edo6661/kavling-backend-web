import { Router } from "express";
import {
  authenticate,
  requirePermission,
} from "../../middlewares/authMiddleware.js";
import { validate } from "../../middlewares/validate.js";
import { upload } from "../../middlewares/upload.js";
import {
  ajukanAgentPencairanSchema,
  batalAgentPencairanSchema,
  bayarAgentPencairanSchema,
  getAgentPencairanPaginatedSchema,
  setAgentBsiCmsDilaporkanSchema,
} from "../../validations/agentPencairanSchema.js";
import type { AgentPencairanController } from "../controllers/agentPencairanController.js";

export const createAgentPencairanRoutes = (
  controller: AgentPencairanController,
): Router => {
  const router = Router();

  router.use(authenticate);

  router.get(
    "/",
    requirePermission(["TAGIHAN", "FEE_AGENT", "AGENT"], "read"),
    validate(getAgentPencairanPaginatedSchema),
    controller.getPaginated,
  );

  router.post(
    "/",
    requirePermission(["FEE_AGENT", "AGENT"], "update"),
    upload.array("fileInvoice", 10),
    validate(ajukanAgentPencairanSchema),
    controller.ajukan,
  );

  router.patch(
    "/bsi-cms-dilaporkan",
    requirePermission("TAGIHAN", "update"),
    validate(setAgentBsiCmsDilaporkanSchema),
    controller.setBsiCmsDilaporkan,
  );

  router.patch(
    "/:id/bayar",
    requirePermission("TAGIHAN", "update"),
    upload.single("buktiPembayaran"),
    validate(bayarAgentPencairanSchema),
    controller.bayar,
  );

  router.patch(
    "/:id/batal",
    requirePermission("TAGIHAN", "update"),
    validate(batalAgentPencairanSchema),
    controller.batal,
  );

  return router;
};
