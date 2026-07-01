import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { sendResponse } from "../../utils/response.js";
import type { GetDashboardSummaryUseCase } from "../../application/usecases/dashboard/GetDashboardSummaryUseCase.js";
import type { GetDashboardDrilldownUseCase } from "../../application/usecases/dashboard/GetDashboardDrilldownUseCase.js";
import type { GetPenjualanPeriodeSummaryUseCase } from "../../application/usecases/dashboard/GetPenjualanPeriodeSummaryUseCase.js";
import type {
  DashboardDrilldownCategory,
  DashboardKpiPeriod,
} from "../../domain/dtos/DashboardDTO.js";

const VALID_KPI_PERIODS: DashboardKpiPeriod[] = ["month", "quarter", "year"];
const VALID_DRILLDOWN_CATEGORIES: DashboardDrilldownCategory[] = [
  "kavling",
  "penjualan",
  "tagihan",
  "progress",
];

export class DashboardController {
  constructor(
    private readonly getDashboardSummaryUseCase: GetDashboardSummaryUseCase,
    private readonly getDashboardDrilldownUseCase: GetDashboardDrilldownUseCase,
    private readonly getPenjualanPeriodeSummaryUseCase: GetPenjualanPeriodeSummaryUseCase,
  ) {}

  getSummary = async (req: Request, res: Response): Promise<void> => {
    const rawMonths = parseInt(req.query.months as string, 10);
    const trendMonths = Number.isFinite(rawMonths) ? rawMonths : 6;

    const rawPeriod = req.query.period as string;
    const kpiPeriod = VALID_KPI_PERIODS.includes(rawPeriod as DashboardKpiPeriod)
      ? (rawPeriod as DashboardKpiPeriod)
      : "month";

    const result = await this.getDashboardSummaryUseCase.execute({
      trendMonths,
      kpiPeriod,
    });

    sendResponse(
      res,
      StatusCodes.OK,
      "Berhasil mengambil data dashboard",
      result,
    );
  };

  getDrilldown = async (req: Request, res: Response): Promise<void> => {
    const category = req.query.category as string;
    const filter = req.query.filter as string | undefined;
    const blok = req.query.blok as string | undefined;

    if (!VALID_DRILLDOWN_CATEGORIES.includes(category as DashboardDrilldownCategory)) {
      sendResponse(res, StatusCodes.BAD_REQUEST, "Kategori drill-down tidak valid");
      return;
    }

    const result = await this.getDashboardDrilldownUseCase.execute({
      category: category as DashboardDrilldownCategory,
      ...(filter !== undefined ? { filter } : {}),
      ...(blok !== undefined ? { blok } : {}),
    });

    sendResponse(
      res,
      StatusCodes.OK,
      "Berhasil mengambil detail drill-down",
      result,
    );
  };

  getPenjualanPeriodeSummary = async (req: Request, res: Response): Promise<void> => {
    const dateFrom = req.query.from as string;
    const dateTo = req.query.to as string;

    if (!dateFrom || !dateTo) {
      sendResponse(res, StatusCodes.BAD_REQUEST, "Parameter from dan to wajib diisi");
      return;
    }

    try {
      const result = await this.getPenjualanPeriodeSummaryUseCase.execute({
        dateFrom,
        dateTo,
      });

      sendResponse(
        res,
        StatusCodes.OK,
        "Berhasil mengambil ringkasan penjualan periode",
        result,
      );
    } catch {
      sendResponse(res, StatusCodes.BAD_REQUEST, "Rentang tanggal tidak valid");
    }
  };
}
