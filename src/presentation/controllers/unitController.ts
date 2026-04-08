import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { sendResponse } from "../../utils/response.js";
import type { TypedRequest } from "../../types/request.js";

import type { CreateUnitUseCase } from "../../application/usecases/unit/CreateUnitUseCase.js";
import type { UpdateUnitUseCase } from "../../application/usecases/unit/UpdateUnitUseCase.js";
import type { GetUnitByIdUseCase } from "../../application/usecases/unit/GetUnitByIdUseCase.js";
import type { GetUnitsPaginatedUseCase } from "../../application/usecases/unit/GetUnitsPaginatedUseCase.js";

import type {
  createUnitSchema,
  updateUnitSchema,
} from "../../validations/unitSchema.js";
import { getUnitsPaginatedSchema } from "../../validations/unitSchema.js";
import type { UnitFilterDTO } from "../../domain/dtos/UnitDTO.js";
import type { DeleteUnitUseCase } from "../../application/usecases/unit/DeleteUnitUseCase.js";
import type { ExportUnitsUseCase } from "../../application/usecases/unit/ExportUnitsUseCase.js";
import type { ExportUnitsPdfUseCase } from "../../application/usecases/unit/ExportUnitsPdfUseCase.js";

export class UnitController {
  constructor(
    private readonly createUnitUseCase: CreateUnitUseCase,
    private readonly updateUnitUseCase: UpdateUnitUseCase,
    private readonly getUnitByIdUseCase: GetUnitByIdUseCase,
    private readonly getUnitsPaginatedUseCase: GetUnitsPaginatedUseCase,
    private readonly deleteUnitUseCase: DeleteUnitUseCase,
    private readonly exportUnitsUseCase: ExportUnitsUseCase,
    private readonly exportUnitsPdfUseCase: ExportUnitsPdfUseCase,
  ) {}

  create = async (
    req: TypedRequest<typeof createUnitSchema.body>,
    res: Response,
  ): Promise<void> => {
    const result = await this.createUnitUseCase.execute(req.body);
    sendResponse(res, StatusCodes.CREATED, "Unit berhasil ditambahkan", result);
  };

  update = async (
    req: TypedRequest<
      typeof updateUnitSchema.body,
      any,
      typeof updateUnitSchema.params
    >,
    res: Response,
  ): Promise<void> => {
    const id = parseInt(req.params.id, 10);

    const result = await this.updateUnitUseCase.execute(id, req.body);
    sendResponse(res, StatusCodes.OK, "Unit berhasil diperbarui", result);
  };
  getById = async (
    req: TypedRequest<any, any, typeof updateUnitSchema.params>,
    res: Response,
  ): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    const result = await this.getUnitByIdUseCase.execute(id);
    sendResponse(res, StatusCodes.OK, "Data unit berhasil diambil", result);
  };

  getPaginated = async (req: Request, res: Response): Promise<void> => {
    const { limit, cursor, ...filters } = getUnitsPaginatedSchema.query.parse(
      req.query,
    );
    const parsedCursor = cursor ? Number(cursor) : undefined;

    const result = await this.getUnitsPaginatedUseCase.execute(
      limit,
      parsedCursor,
      filters as UnitFilterDTO,
    );
    sendResponse(
      res,
      StatusCodes.OK,
      "Data daftar unit berhasil diambil",
      result,
    );
  };
  delete = async (
    req: TypedRequest<any, any, typeof updateUnitSchema.params>,
    res: Response,
  ): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    await this.deleteUnitUseCase.execute(id);
    sendResponse(res, StatusCodes.OK, "Unit berhasil dihapus");
  };
  exportExcel = async (_req: Request, res: Response): Promise<void> => {
    const excelBuffer = await this.exportUnitsUseCase.execute();
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `Data_Unit_${timestamp}.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    res.status(StatusCodes.OK).send(excelBuffer);
  };
  exportPdf = async (_req: Request, res: Response): Promise<void> => {
    const pdfBuffer = await this.exportUnitsPdfUseCase.execute();
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `Data_Unit_${timestamp}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    res.status(StatusCodes.OK).send(pdfBuffer);
  };
}
