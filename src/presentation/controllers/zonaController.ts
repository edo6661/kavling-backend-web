import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { sendResponse } from "../../utils/response.js";
import type { TypedRequest } from "../../types/request.js";
import type {
  CreateZonaUseCase,
  UpdateZonaUseCase,
  GetZonaByIdUseCase,
  GetZonaListUseCase,
  DeleteZonaUseCase,
} from "../../application/usecases/zona/ZonaUseCases.js";
import type {
  createZonaSchema,
  updateZonaSchema,
} from "../../validations/zonaSchema.js";
import { getZonaListSchema } from "../../validations/zonaSchema.js";

export class ZonaController {
  constructor(
    private readonly createUseCase: CreateZonaUseCase,
    private readonly updateUseCase: UpdateZonaUseCase,
    private readonly getByIdUseCase: GetZonaByIdUseCase,
    private readonly getListUseCase: GetZonaListUseCase,
    private readonly deleteUseCase: DeleteZonaUseCase,
  ) {}

  create = async (
    req: TypedRequest<typeof createZonaSchema.body>,
    res: Response,
  ): Promise<void> => {
    const result = await this.createUseCase.execute(req.body);
    sendResponse(res, StatusCodes.CREATED, "Zona berhasil ditambahkan", result);
  };

  update = async (
    req: TypedRequest<
      typeof updateZonaSchema.body,
      never,
      typeof updateZonaSchema.params
    >,
    res: Response,
  ): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    const result = await this.updateUseCase.execute(id, req.body);
    sendResponse(res, StatusCodes.OK, "Zona berhasil diperbarui", result);
  };

  getById = async (
    req: TypedRequest<never, never, typeof updateZonaSchema.params>,
    res: Response,
  ): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    const result = await this.getByIdUseCase.execute(id);
    sendResponse(res, StatusCodes.OK, "Data zona berhasil diambil", result);
  };

  getList = async (req: Request, res: Response): Promise<void> => {
    const { search } = getZonaListSchema.query.parse(req.query);
    const result = await this.getListUseCase.execute(search ? { search } : undefined);
    sendResponse(res, StatusCodes.OK, "Daftar zona berhasil diambil", result);
  };

  delete = async (
    req: TypedRequest<never, never, typeof updateZonaSchema.params>,
    res: Response,
  ): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    await this.deleteUseCase.execute(id);
    sendResponse(res, StatusCodes.OK, "Zona berhasil dihapus");
  };
}
