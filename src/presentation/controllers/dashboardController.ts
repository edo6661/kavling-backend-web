import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { sendResponse } from "../../utils/response.js";
import type { GetDashboardSummaryUseCase } from "../../application/usecases/dashboard/GetDashboardSummaryUseCase.js";
import type { GetDashboardDrilldownUseCase } from "../../application/usecases/dashboard/GetDashboardDrilldownUseCase.js";
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
}
