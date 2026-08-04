import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import type { ExportDatabaseExcelUseCase } from "../../application/usecases/admin/ExportDatabaseExcelUseCase.js";

export class AdminExportController {
  constructor(
    private readonly exportDatabaseExcelUseCase: ExportDatabaseExcelUseCase,
  ) {}

  exportDatabaseExcel = async (_req: Request, res: Response): Promise<void> => {
    const excelBuffer = await this.exportDatabaseExcelUseCase.execute();
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `Export_Database_${timestamp}.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    res.status(StatusCodes.OK).send(excelBuffer);
  };
}
