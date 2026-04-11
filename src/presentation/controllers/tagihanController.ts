import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { sendResponse } from "../../utils/response.js";
import type { TypedRequest } from "../../types/request.js";

import type {
  CreateTagihanUseCase,
  UpdateTagihanUseCase,
  GetTagihanByIdUseCase,
  GetTagihansPaginatedUseCase,
  DeleteTagihanUseCase,
} from "../../application/usecases/tagihan/TagihanUseCases.js";
import type { UploadBuktiTagihanUseCase } from "../../application/usecases/tagihan/UploadBuktiTagihanUseCase.js";

import type {
  createTagihanSchema,
  updateTagihanSchema,
} from "../../validations/tagihanSchema.js";
import { getTagihansPaginatedSchema } from "../../validations/tagihanSchema.js";
import type { TagihanFilterDTO } from "../../domain/dtos/TagihanDTO.js";

export class TagihanController {
  constructor(
    private readonly createUseCase: CreateTagihanUseCase,
    private readonly updateUseCase: UpdateTagihanUseCase,
    private readonly getByIdUseCase: GetTagihanByIdUseCase,
    private readonly getPaginatedUseCase: GetTagihansPaginatedUseCase,
    private readonly deleteUseCase: DeleteTagihanUseCase,
    private readonly uploadBuktiUseCase: UploadBuktiTagihanUseCase,
  ) {}

  create = async (
    req: TypedRequest<typeof createTagihanSchema.body>,
    res: Response,
  ): Promise<void> => {
    const result = await this.createUseCase.execute(req.body);
    sendResponse(res, StatusCodes.CREATED, "Tagihan berhasil dibuat", result);
  };

  update = async (
    req: TypedRequest<
      typeof updateTagihanSchema.body,
      any,
      typeof updateTagihanSchema.params
    >,
    res: Response,
  ): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    const result = await this.updateUseCase.execute(id, req.body);
    sendResponse(res, StatusCodes.OK, "Tagihan berhasil diperbarui", result);
  };

  getById = async (
    req: TypedRequest<any, any, typeof updateTagihanSchema.params>,
    res: Response,
  ): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    const result = await this.getByIdUseCase.execute(id);
    sendResponse(res, StatusCodes.OK, "Data tagihan berhasil diambil", result);
  };

  getPaginated = async (req: Request, res: Response): Promise<void> => {
    const { limit, cursor, ...filters } =
      getTagihansPaginatedSchema.query.parse(req.query);
    const parsedCursor = cursor ? Number(cursor) : undefined;

    const result = await this.getPaginatedUseCase.execute(
      limit,
      parsedCursor,
      filters as TagihanFilterDTO,
    );
    sendResponse(
      res,
      StatusCodes.OK,
      "Daftar tagihan berhasil diambil",
      result,
    );
  };

  delete = async (
    req: TypedRequest<any, any, typeof updateTagihanSchema.params>,
    res: Response,
  ): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    await this.deleteUseCase.execute(id);
    sendResponse(res, StatusCodes.OK, "Tagihan berhasil dihapus");
  };

  uploadBukti = async (
    req: TypedRequest<any, any, typeof updateTagihanSchema.params>,
    res: Response,
  ): Promise<void> => {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      sendResponse(res, StatusCodes.BAD_REQUEST, "ID tidak valid");
      return;
    }

    if (!req.file?.buffer) {
      sendResponse(res, StatusCodes.BAD_REQUEST, "File dokumen wajib diunggah");
      return;
    }

    const result = await this.uploadBuktiUseCase.execute(id, req.file.buffer);
    sendResponse(
      res,
      StatusCodes.OK,
      "Bukti pembayaran berhasil diunggah",
      result,
    );
  };
}
