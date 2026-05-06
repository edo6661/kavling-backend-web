import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { sendResponse } from "../../utils/response.js";
import type { TypedRequest } from "../../types/request.js";

import type {
  CreateKavlingUseCase,
  UpdateKavlingUseCase,
  GetKavlingByIdUseCase,
  GetKavlingsPaginatedUseCase,
  DeleteKavlingUseCase,
} from "../../application/usecases/kavling/KavlingUseCases.js";

import type {
  createKavlingSchema,
  updateKavlingSchema,
  uploadKavlingDocumentSchema,
} from "../../validations/kavlingSchema.js";
import { getKavlingPaginatedSchema } from "../../validations/kavlingSchema.js";
import type { KavlingFilterDTO } from "../../domain/dtos/KavlingDTO.js";
import type { UploadKavlingDocumentUseCase } from "../../application/usecases/kavling/UploadKavlingDocumentUseCase.js";

export class KavlingController {
  constructor(
    private readonly createUseCase: CreateKavlingUseCase,
    private readonly updateUseCase: UpdateKavlingUseCase,
    private readonly getByIdUseCase: GetKavlingByIdUseCase,
    private readonly getPaginatedUseCase: GetKavlingsPaginatedUseCase,
    private readonly deleteUseCase: DeleteKavlingUseCase,
    private readonly uploadDocumentUseCase: UploadKavlingDocumentUseCase,
  ) {}

  create = async (
    req: TypedRequest<typeof createKavlingSchema.body>,
    res: Response,
  ): Promise<void> => {
    const result = await this.createUseCase.execute(req.body);
    sendResponse(
      res,
      StatusCodes.CREATED,
      "Kavling berhasil ditambahkan",
      result,
    );
  };

  update = async (
    req: TypedRequest<
      typeof updateKavlingSchema.body,
      any,
      typeof updateKavlingSchema.params
    >,
    res: Response,
  ): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    const result = await this.updateUseCase.execute(id, req.body);
    sendResponse(res, StatusCodes.OK, "Kavling berhasil diperbarui", result);
  };

  getById = async (
    req: TypedRequest<any, any, typeof updateKavlingSchema.params>,
    res: Response,
  ): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    const result = await this.getByIdUseCase.execute(id);
    sendResponse(res, StatusCodes.OK, "Data kavling berhasil diambil", result);
  };

  getPaginated = async (req: Request, res: Response): Promise<void> => {
    const { page, limit, ...filters } = getKavlingPaginatedSchema.query.parse(
      req.query,
    );

    const result = await this.getPaginatedUseCase.execute(
      page,
      limit,
      filters as KavlingFilterDTO,
    );

    sendResponse(
      res,
      StatusCodes.OK,
      "Daftar kavling berhasil diambil",
      result,
    );
  };

  delete = async (
    req: TypedRequest<any, any, typeof updateKavlingSchema.params>,
    res: Response,
  ): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    await this.deleteUseCase.execute(id);
    sendResponse(res, StatusCodes.OK, "Kavling berhasil dihapus");
  };
  uploadDocument = async (
    req: TypedRequest<any, any, typeof uploadKavlingDocumentSchema.params>,
    res: Response,
  ): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    const docType = req.params.docType;

    if (!req.file?.buffer) {
      sendResponse(res, StatusCodes.BAD_REQUEST, "File dokumen wajib diunggah");
      return;
    }

    const result = await this.uploadDocumentUseCase.execute(
      id,
      req.file.buffer,
      docType,
    );
    sendResponse(
      res,
      StatusCodes.OK,
      `Dokumen ${docType} berhasil diunggah`,
      result,
    );
  };
}
