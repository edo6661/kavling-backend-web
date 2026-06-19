import { Router } from "express";
import {
  authenticate,
  requirePermission,
} from "../../middlewares/authMiddleware.js";
import { validate } from "../../middlewares/validate.js";
import {
  getBiayaProyekReportSchema,
  getKeuanganReportSchema,
  getMarketingReportSchema,
  getPenjualanReportSchema,
  getProgressProyekReportSchema,
  getPemasukanPenjualanReportSchema,
  getRekapPemasukanReportSchema,
  getRekapPembayaranReportSchema,
} from "../../validations/reportSchema.js";
import type { ReportController } from "../controllers/reportController.js";

export const createReportRoutes = (controller: ReportController): Router => {
  const router = Router();

  router.use(authenticate);

  router.get(
    "/biaya-proyek",
    requirePermission(["LAPORAN", "SPK"], "read"),
    validate(getBiayaProyekReportSchema),
    controller.getBiayaProyek,
  );

  router.get(
    "/progress-proyek",
    requirePermission(["LAPORAN", "PROGRESS_PROYEK"], "read"),
    validate(getProgressProyekReportSchema),
    controller.getProgressProyek,
  );

  router.get(
    "/penjualan",
    requirePermission(["LAPORAN", "PENJUALAN"], "read"),
    validate(getPenjualanReportSchema),
    controller.getPenjualan,
  );

  router.get(
    "/rekap-pembayaran",
    requirePermission(["LAPORAN", "PENJUALAN"], "read"),
    validate(getRekapPembayaranReportSchema),
    controller.getRekapPembayaran,
  );

  router.get(
    "/pemasukan-penjualan",
    requirePermission(["LAPORAN", "PENJUALAN", "TAGIHAN"], "read"),
    validate(getPemasukanPenjualanReportSchema),
    controller.getPemasukanPenjualan,
  );

  router.get(
    "/rekap-pemasukan",
    requirePermission(["LAPORAN", "PENJUALAN", "TAGIHAN"], "read"),
    validate(getRekapPemasukanReportSchema),
    controller.getRekapPemasukan,
  );

  router.get(
    "/keuangan",
    requirePermission(["LAPORAN", "TAGIHAN"], "read"),
    validate(getKeuanganReportSchema),
    controller.getKeuangan,
  );

  router.get(
    "/marketing",
    requirePermission(["LAPORAN", "FEE_AGENT", "PENJUALAN"], "read"),
    validate(getMarketingReportSchema),
    controller.getMarketing,
  );

  router.get(
    "/marketing/export/excel",
    requirePermission(["LAPORAN", "FEE_AGENT", "PENJUALAN"], "read"),
    validate(getMarketingReportSchema),
    controller.exportMarketingExcel,
  );

  return router;
};
