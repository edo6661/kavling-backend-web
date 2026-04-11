import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { sendResponse } from "../../utils/response.js";
import type { TypedRequest } from "../../types/request.js";

import type { GetPenjualanPaginatedUseCase } from "../../application/usecases/penjualan/GetPenjualanPaginatedUseCase.js";
import type { createPenjualanSchema } from "../../validations/penjualanSchema.js";
import { getPenjualanPaginatedSchema } from "../../validations/penjualanSchema.js";
import type { PenjualanFilterDTO } from "../../domain/dtos/PenjualanDTO.js";
import type { CreatePenjualanUseCase } from "../../application/usecases/penjualan/CreatePenjualanUseCase.js";

export class PenjualanController {
  constructor(
    private readonly createUseCase: CreatePenjualanUseCase,
    private readonly getPaginatedUseCase: GetPenjualanPaginatedUseCase,
  ) {}

  create = async (
    req: TypedRequest<typeof createPenjualanSchema.body>,
    res: Response,
  ): Promise<void> => {
    const result = await this.createUseCase.execute(req.body);
    sendResponse(
      res,
      StatusCodes.CREATED,
      "Data Penjualan berhasil disimpan dan tagihan awal telah dibuat.",
      result,
    );
  };

  getPaginated = async (req: Request, res: Response): Promise<void> => {
    const { limit, cursor, ...filters } =
      getPenjualanPaginatedSchema.query.parse(req.query);
    const parsedCursor = cursor ? Number(cursor) : undefined;

    const result = await this.getPaginatedUseCase.execute(
      limit,
      parsedCursor,
      filters as PenjualanFilterDTO,
    );

    sendResponse(
      res,
      StatusCodes.OK,
      "Data penjualan berhasil diambil",
      result,
    );
  };
}
