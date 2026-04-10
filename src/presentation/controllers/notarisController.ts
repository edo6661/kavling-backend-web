import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { sendResponse } from "../../utils/response.js";
import type { TypedRequest } from "../../types/request.js";

import type {
  CreateNotarisUseCase,
  UpdateNotarisUseCase,
  GetNotarisByIdUseCase,
  GetNotarisPaginatedUseCase,
  DeleteNotarisUseCase,
} from "../../application/usecases/notaris/NotarisUseCases.js";

import type {
  createNotarisSchema,
  updateNotarisSchema,
} from "../../validations/notarisSchema.js";
import { getNotarisPaginatedSchema } from "../../validations/notarisSchema.js";
import type { NotarisFilterDTO } from "../../domain/dtos/NotarisDTO.js";

export class NotarisController {
  constructor(
    private readonly createUseCase: CreateNotarisUseCase,
    private readonly updateUseCase: UpdateNotarisUseCase,
    private readonly getByIdUseCase: GetNotarisByIdUseCase,
    private readonly getPaginatedUseCase: GetNotarisPaginatedUseCase,
    private readonly deleteUseCase: DeleteNotarisUseCase,
  ) {}

  create = async (
    req: TypedRequest<typeof createNotarisSchema.body>,
    res: Response,
  ): Promise<void> => {
    const result = await this.createUseCase.execute(req.body);
    sendResponse(
      res,
      StatusCodes.CREATED,
      "Notaris berhasil ditambahkan",
      result,
    );
  };

  update = async (
    req: TypedRequest<
      typeof updateNotarisSchema.body,
      any,
      typeof updateNotarisSchema.params
    >,
    res: Response,
  ): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    const result = await this.updateUseCase.execute(id, req.body);
    sendResponse(res, StatusCodes.OK, "Notaris berhasil diperbarui", result);
  };

  getById = async (
    req: TypedRequest<any, any, typeof updateNotarisSchema.params>,
    res: Response,
  ): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    const result = await this.getByIdUseCase.execute(id);
    sendResponse(res, StatusCodes.OK, "Data notaris berhasil diambil", result);
  };

  getPaginated = async (req: Request, res: Response): Promise<void> => {
    const { limit, cursor, ...filters } = getNotarisPaginatedSchema.query.parse(
      req.query,
    );
    const parsedCursor = cursor ? Number(cursor) : undefined;

    const result = await this.getPaginatedUseCase.execute(
      limit,
      parsedCursor,
      filters as NotarisFilterDTO,
    );

    sendResponse(
      res,
      StatusCodes.OK,
      "Daftar notaris berhasil diambil",
      result,
    );
  };

  delete = async (
    req: TypedRequest<any, any, typeof updateNotarisSchema.params>,
    res: Response,
  ): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    await this.deleteUseCase.execute(id);
    sendResponse(res, StatusCodes.OK, "Notaris berhasil dihapus");
  };
}
