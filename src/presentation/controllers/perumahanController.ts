import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { sendResponse } from "../../utils/response.js";
import type { TypedRequest } from "../../types/request.js";
import type {
  CreatePerumahanUseCase,
  UpdatePerumahanUseCase,
  GetPerumahanByIdUseCase,
  GetPerumahanPaginatedUseCase,
  DeletePerumahanUseCase,
} from "../../application/usecases/perumahan/PerumahanUseCases.js";
import type {
  createPerumahanSchema,
  updatePerumahanSchema,
} from "../../validations/perumahanSchema.js";
import { getPerumahanPaginatedSchema } from "../../validations/perumahanSchema.js";
import type { PerumahanFilterDTO } from "../../domain/dtos/PerumahanDTO.js";

export class PerumahanController {
  constructor(
    private readonly createUseCase: CreatePerumahanUseCase,
    private readonly updateUseCase: UpdatePerumahanUseCase,
    private readonly getByIdUseCase: GetPerumahanByIdUseCase,
    private readonly getPaginatedUseCase: GetPerumahanPaginatedUseCase,
    private readonly deleteUseCase: DeletePerumahanUseCase,
  ) {}

  create = async (
    req: TypedRequest<typeof createPerumahanSchema.body>,
    res: Response,
  ): Promise<void> => {
    const result = await this.createUseCase.execute(req.body);
    sendResponse(
      res,
      StatusCodes.CREATED,
      "Perumahan berhasil ditambahkan",
      result,
    );
  };

  update = async (
    req: TypedRequest<
      typeof updatePerumahanSchema.body,
      any,
      typeof updatePerumahanSchema.params
    >,
    res: Response,
  ): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    const result = await this.updateUseCase.execute(id, req.body);
    sendResponse(res, StatusCodes.OK, "Perumahan berhasil diperbarui", result);
  };

  getById = async (
    req: TypedRequest<any, any, typeof updatePerumahanSchema.params>,
    res: Response,
  ): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    const result = await this.getByIdUseCase.execute(id);
    sendResponse(
      res,
      StatusCodes.OK,
      "Data perumahan berhasil diambil",
      result,
    );
  };

  getPaginated = async (req: Request, res: Response): Promise<void> => {
    const { limit, cursor, ...filters } =
      getPerumahanPaginatedSchema.query.parse(req.query);
    const parsedCursor = cursor ? Number(cursor) : undefined;
    const result = await this.getPaginatedUseCase.execute(
      limit,
      parsedCursor,
      filters as PerumahanFilterDTO,
    );
    sendResponse(
      res,
      StatusCodes.OK,
      "Daftar perumahan berhasil diambil",
      result,
    );
  };

  delete = async (
    req: TypedRequest<any, any, typeof updatePerumahanSchema.params>,
    res: Response,
  ): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    await this.deleteUseCase.execute(id);
    sendResponse(res, StatusCodes.OK, "Perumahan berhasil dihapus");
  };
}
