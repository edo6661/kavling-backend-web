import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { sendResponse } from "../../utils/response.js";
import type { TypedRequest } from "../../types/request.js";
import type {
  CreateSpkUseCase,
  UpdateSpkUseCase,
  GetSpkByIdUseCase,
  GetSpkPaginatedUseCase,
  DeleteSpkUseCase,
} from "../../application/usecases/spk/SpkUseCases.js";
import type {
  createSpkSchema,
  updateSpkSchema,
} from "../../validations/spkSchema.js";
import { getSpkPaginatedSchema } from "../../validations/spkSchema.js";
import type { SpkFilterDTO } from "../../domain/dtos/SpkDTO.js";

export class SpkController {
  constructor(
    private readonly createUseCase: CreateSpkUseCase,
    private readonly updateUseCase: UpdateSpkUseCase,
    private readonly getByIdUseCase: GetSpkByIdUseCase,
    private readonly getPaginatedUseCase: GetSpkPaginatedUseCase,
    private readonly deleteUseCase: DeleteSpkUseCase,
  ) {}

  create = async (
    req: TypedRequest<typeof createSpkSchema.body>,
    res: Response,
  ): Promise<void> => {
    const file = req.file as Express.Multer.File | undefined;
    const result = await this.createUseCase.execute(
      req.body,
      file?.buffer,
    );
    sendResponse(res, StatusCodes.CREATED, "SPK berhasil dibuat", result);
  };

  update = async (
    req: TypedRequest<
      typeof updateSpkSchema.body,
      never,
      typeof updateSpkSchema.params
    >,
    res: Response,
  ): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    const file = req.file as Express.Multer.File | undefined;
    const result = await this.updateUseCase.execute(
      id,
      req.body,
      file?.buffer,
    );
    sendResponse(res, StatusCodes.OK, "SPK berhasil diperbarui", result);
  };

  getById = async (
    req: TypedRequest<never, never, typeof updateSpkSchema.params>,
    res: Response,
  ): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    const result = await this.getByIdUseCase.execute(id);
    sendResponse(res, StatusCodes.OK, "Data SPK berhasil diambil", result);
  };

  getPaginated = async (req: Request, res: Response): Promise<void> => {
    const { limit, cursor, search } = getSpkPaginatedSchema.query.parse(
      req.query,
    );

    const filters: SpkFilterDTO = {};
    if (search) filters.search = search;

    const result = await this.getPaginatedUseCase.execute(
      limit,
      cursor,
      filters,
    );
    sendResponse(res, StatusCodes.OK, "Daftar SPK berhasil diambil", result);
  };

  delete = async (
    req: TypedRequest<never, never, typeof updateSpkSchema.params>,
    res: Response,
  ): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    await this.deleteUseCase.execute(id);
    sendResponse(res, StatusCodes.OK, "SPK berhasil dihapus");
  };
}
