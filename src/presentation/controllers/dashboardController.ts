import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { sendResponse } from "../../utils/response.js";
import type { GetDashboardSummaryUseCase } from "../../application/usecases/dashboard/GetDashboardSummaryUseCase.js";

export class DashboardController {
  constructor(private readonly getSummaryUseCase: GetDashboardSummaryUseCase) {}

  getSummary = async (_req: Request, res: Response): Promise<void> => {
    const result = await this.getSummaryUseCase.execute();
    sendResponse(
      res,
      StatusCodes.OK,
      "Berhasil mengambil summary dashboard",
      result,
    );
  };
}
