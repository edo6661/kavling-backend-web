import type { Request, Response } from "express";
import { Role } from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import { AppError } from "../../domain/errors/AppError.js";
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
import { omitUndefined } from "../../utils/object.js";

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
      omitUndefined(req.body),
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
      omitUndefined(req.body),
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
    if (req.user?.role === Role.MANDOR && result.mandorId !== req.user.userId) {
      throw new AppError(StatusCodes.FORBIDDEN, "Anda tidak memiliki akses ke SPK ini");
    }
    sendResponse(res, StatusCodes.OK, "Data SPK berhasil diambil", result);
  };

  getPaginated = async (req: Request, res: Response): Promise<void> => {
    const { page, limit, search, orderBy, jenis } = getSpkPaginatedSchema.query.parse(
      req.query,
    );

    const filters: SpkFilterDTO = {};
    if (search) filters.search = search;
    if (orderBy) filters.orderBy = orderBy;
    if (jenis) filters.jenis = jenis;
    if (req.user?.role === Role.MANDOR && req.user.userId) {
      filters.mandorId = req.user.userId;
    }

    const result = await this.getPaginatedUseCase.execute(page, limit, filters);
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
