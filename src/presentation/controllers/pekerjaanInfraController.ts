import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { sendResponse } from "../../utils/response.js";
import type { TypedRequest } from "../../types/request.js";
import type {
  CreatePekerjaanInfraUseCase,
  UpdatePekerjaanInfraUseCase,
  DeletePekerjaanInfraUseCase,
  GetPekerjaanInfraListUseCase,
} from "../../application/usecases/pekerjaanInfra/PekerjaanInfraUseCases.js";
import type {
  createPekerjaanInfraSchema,
  updatePekerjaanInfraSchema,
} from "../../validations/pekerjaanInfraSchema.js";

export class PekerjaanInfraController {
  constructor(
    private readonly getListUseCase: GetPekerjaanInfraListUseCase,
    private readonly createUseCase: CreatePekerjaanInfraUseCase,
    private readonly updateUseCase: UpdatePekerjaanInfraUseCase,
    private readonly deleteUseCase: DeletePekerjaanInfraUseCase,
  ) {}

  getList = async (_req: Request, res: Response): Promise<void> => {
    const result = await this.getListUseCase.execute();
    sendResponse(
      res,
      StatusCodes.OK,
      "Daftar pekerjaan infrastruktur berhasil diambil",
      result,
    );
  };

  create = async (
    req: TypedRequest<typeof createPekerjaanInfraSchema.body>,
    res: Response,
  ): Promise<void> => {
    const result = await this.createUseCase.execute(req.body);
    sendResponse(
      res,
      StatusCodes.CREATED,
      "Pekerjaan infrastruktur berhasil ditambahkan",
      result,
    );
  };

  update = async (
    req: TypedRequest<
      typeof updatePekerjaanInfraSchema.body,
      never,
      typeof updatePekerjaanInfraSchema.params
    >,
    res: Response,
  ): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    const result = await this.updateUseCase.execute(id, req.body);
    sendResponse(
      res,
      StatusCodes.OK,
      "Pekerjaan infrastruktur berhasil diperbarui",
      result,
    );
  };

  delete = async (
    req: TypedRequest<never, never, typeof updatePekerjaanInfraSchema.params>,
    res: Response,
  ): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    await this.deleteUseCase.execute(id);
    sendResponse(res, StatusCodes.OK, "Pekerjaan infrastruktur berhasil dihapus");
  };
}
