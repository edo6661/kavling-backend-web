import type { Response } from "express";
import { StatusCodes } from "http-status-codes";
import { sendResponse } from "../../utils/response.js";
import type { TypedRequest } from "../../types/request.js";

import type {
  GetProgressPenjualanUseCase,
  UpdateProgressPenjualanUseCase,
  UploadProgressDocumentUseCase,
} from "../../application/usecases/progressPenjualan/ProgressPenjualanUseCases.js";

import type {
  updateProgressPenjualanSchema,
  uploadProgressDocumentSchema,
  getProgressPenjualanSchema,
} from "../../validations/progressPenjualanSchema.js";

export class ProgressPenjualanController {
  constructor(
    private readonly getUseCase: GetProgressPenjualanUseCase,
    private readonly updateUseCase: UpdateProgressPenjualanUseCase,
    private readonly uploadUseCase: UploadProgressDocumentUseCase,
  ) {}

  getByPenjualanId = async (
    req: TypedRequest<any, any, typeof getProgressPenjualanSchema.params>,
    res: Response,
  ): Promise<void> => {
    const penjualanId = parseInt(req.params.id, 10);
    const result = await this.getUseCase.execute(penjualanId);
    sendResponse(
      res,
      StatusCodes.OK,
      "Data progress penjualan berhasil diambil",
      result,
    );
  };

  update = async (
    req: TypedRequest<
      typeof updateProgressPenjualanSchema.body,
      any,
      typeof updateProgressPenjualanSchema.params
    >,
    res: Response,
  ): Promise<void> => {
    const penjualanId = parseInt(req.params.id, 10);
    const result = await this.updateUseCase.execute(penjualanId, req.body);
    sendResponse(
      res,
      StatusCodes.OK,
      "Data progress penjualan berhasil diperbarui",
      result,
    );
  };

  uploadDocument = async (
    req: TypedRequest<any, any, typeof uploadProgressDocumentSchema.params>,
    res: Response,
  ): Promise<void> => {
    const penjualanId = parseInt(req.params.id, 10);
    const docType = req.params.docType;

    if (!req.file?.buffer) {
      sendResponse(res, StatusCodes.BAD_REQUEST, "File dokumen wajib diunggah");
      return;
    }

    const result = await this.uploadUseCase.execute(
      penjualanId,
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
