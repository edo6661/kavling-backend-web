import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { sendResponse } from "../../utils/response.js";
import type { TypedRequest } from "../../types/request.js";
import type {
  CreateBankRekeningPtUseCase,
  UpdateBankRekeningPtUseCase,
  GetBankRekeningPtByIdUseCase,
  GetBankRekeningPtPaginatedUseCase,
  DeleteBankRekeningPtUseCase,
} from "../../application/usecases/bankRekeningPt/BankRekeningPtUseCases.js";
import type {
  createBankRekeningPtSchema,
  updateBankRekeningPtSchema,
} from "../../validations/bankRekeningPtSchema.js";
import { getBankRekeningPtPaginatedSchema } from "../../validations/bankRekeningPtSchema.js";
import type { BankRekeningPtFilterDTO } from "../../domain/dtos/BankRekeningPtDTO.js";

export class BankRekeningPtController {
  constructor(
    private readonly createUseCase: CreateBankRekeningPtUseCase,
    private readonly updateUseCase: UpdateBankRekeningPtUseCase,
    private readonly getByIdUseCase: GetBankRekeningPtByIdUseCase,
    private readonly getPaginatedUseCase: GetBankRekeningPtPaginatedUseCase,
    private readonly deleteUseCase: DeleteBankRekeningPtUseCase,
  ) {}

  create = async (
    req: TypedRequest<typeof createBankRekeningPtSchema.body>,
    res: Response,
  ): Promise<void> => {
    const result = await this.createUseCase.execute(req.body);
    sendResponse(
      res,
      StatusCodes.CREATED,
      "Rekening berhasil ditambahkan",
      result,
    );
  };

  update = async (
    req: TypedRequest<
      typeof updateBankRekeningPtSchema.body,
      any,
      typeof updateBankRekeningPtSchema.params
    >,
    res: Response,
  ): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    const result = await this.updateUseCase.execute(id, req.body);
    sendResponse(res, StatusCodes.OK, "Rekening berhasil diperbarui", result);
  };

  getById = async (
    req: TypedRequest<any, any, typeof updateBankRekeningPtSchema.params>,
    res: Response,
  ): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    const result = await this.getByIdUseCase.execute(id);
    sendResponse(res, StatusCodes.OK, "Data rekening berhasil diambil", result);
  };

  getPaginated = async (req: Request, res: Response): Promise<void> => {
    const { limit, cursor, ...filters } =
      getBankRekeningPtPaginatedSchema.query.parse(req.query);
    const parsedCursor = cursor ? Number(cursor) : undefined;
    const result = await this.getPaginatedUseCase.execute(
      limit,
      parsedCursor,
      filters as BankRekeningPtFilterDTO,
    );
    sendResponse(
      res,
      StatusCodes.OK,
      "Daftar rekening berhasil diambil",
      result,
    );
  };

  delete = async (
    req: TypedRequest<any, any, typeof updateBankRekeningPtSchema.params>,
    res: Response,
  ): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    await this.deleteUseCase.execute(id);
    sendResponse(res, StatusCodes.OK, "Rekening berhasil dihapus");
  };
}
