import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { sendResponse } from "../../utils/response.js";
import type { GetBiayaProyekReportUseCase } from "../../application/usecases/report/GetBiayaProyekReportUseCase.js";
import type { GetProgressProyekReportUseCase } from "../../application/usecases/report/GetProgressProyekReportUseCase.js";
import type { GetPenjualanReportUseCase } from "../../application/usecases/report/GetPenjualanReportUseCase.js";
import type { GetKeuanganReportUseCase } from "../../application/usecases/report/GetKeuanganReportUseCase.js";
import type { GetMarketingReportUseCase } from "../../application/usecases/report/GetMarketingReportUseCase.js";
import type { ExportMarketingReportUseCase } from "../../application/usecases/report/ExportMarketingReportUseCase.js";
import type { BiayaProyekReportFilterDTO } from "../../domain/dtos/BiayaProyekReportDTO.js";
import type { ProgressProyekReportFilterDTO } from "../../domain/dtos/ProgressProyekReportDTO.js";
import type { PenjualanReportFilterDTO } from "../../domain/dtos/PenjualanReportDTO.js";
import type { KeuanganReportFilterDTO } from "../../domain/dtos/KeuanganReportDTO.js";
import type { MarketingReportFilterDTO } from "../../domain/dtos/MarketingReportDTO.js";

export class ReportController {
  constructor(
    private readonly getBiayaProyekReportUseCase: GetBiayaProyekReportUseCase,
    private readonly getProgressProyekReportUseCase: GetProgressProyekReportUseCase,
    private readonly getPenjualanReportUseCase: GetPenjualanReportUseCase,
    private readonly getKeuanganReportUseCase: GetKeuanganReportUseCase,
    private readonly getMarketingReportUseCase: GetMarketingReportUseCase,
    private readonly exportMarketingReportUseCase: ExportMarketingReportUseCase,
  ) {}

  getBiayaProyek = async (req: Request, res: Response): Promise<void> => {
    const result = await this.getBiayaProyekReportUseCase.execute(
      req.query as BiayaProyekReportFilterDTO,
    );
    sendResponse(
      res,
      StatusCodes.OK,
      "Berhasil mengambil laporan biaya proyek",
      result,
    );
  };

  getProgressProyek = async (req: Request, res: Response): Promise<void> => {
    const result = await this.getProgressProyekReportUseCase.execute(
      req.query as ProgressProyekReportFilterDTO,
    );
    sendResponse(
      res,
      StatusCodes.OK,
      "Berhasil mengambil laporan progress proyek",
      result,
    );
  };

  getPenjualan = async (req: Request, res: Response): Promise<void> => {
    const result = await this.getPenjualanReportUseCase.execute(
      req.query as PenjualanReportFilterDTO,
    );
    sendResponse(
      res,
      StatusCodes.OK,
      "Berhasil mengambil laporan penjualan",
      result,
    );
  };

  getKeuangan = async (req: Request, res: Response): Promise<void> => {
    const result = await this.getKeuanganReportUseCase.execute(
      req.query as KeuanganReportFilterDTO,
    );
    sendResponse(
      res,
      StatusCodes.OK,
      "Berhasil mengambil laporan keuangan",
      result,
    );
  };

  getMarketing = async (req: Request, res: Response): Promise<void> => {
    const result = await this.getMarketingReportUseCase.execute(
      req.query as MarketingReportFilterDTO,
    );
    sendResponse(
      res,
      StatusCodes.OK,
      "Berhasil mengambil laporan marketing",
      result,
    );
  };

  exportMarketingExcel = async (req: Request, res: Response): Promise<void> => {
    const excelBuffer = await this.exportMarketingReportUseCase.execute(
      req.query as MarketingReportFilterDTO,
    );
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `Laporan_Marketing_${timestamp}.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    res.status(StatusCodes.OK).send(excelBuffer);
  };
}
