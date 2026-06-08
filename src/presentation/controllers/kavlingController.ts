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
  uploadKavlingSertifikatTambahanSchema,
} from "../../validations/kavlingSchema.js";
import { getKavlingPaginatedSchema } from "../../validations/kavlingSchema.js";
import type { KavlingFilterDTO } from "../../domain/dtos/KavlingDTO.js";
import type { UploadKavlingDocumentUseCase } from "../../application/usecases/kavling/UploadKavlingDocumentUseCase.js";
import type { UploadKavlingSertifikatTambahanDocumentUseCase } from "../../application/usecases/kavling/UploadKavlingSertifikatTambahanDocumentUseCase.js";
import type { ExportKavlingsUseCase } from "../../application/usecases/kavling/ExportKavlingsUseCase.js";
import type { ExportKavlingPengeluaranUseCase } from "../../application/usecases/kavling/ExportKavlingPengeluaranUseCase.js";
import { getKavlingExportSchema } from "../../validations/kavlingSchema.js";

export class KavlingController {
  constructor(
    private readonly createUseCase: CreateKavlingUseCase,
    private readonly updateUseCase: UpdateKavlingUseCase,
    private readonly getByIdUseCase: GetKavlingByIdUseCase,
    private readonly getPaginatedUseCase: GetKavlingsPaginatedUseCase,
    private readonly deleteUseCase: DeleteKavlingUseCase,
    private readonly uploadDocumentUseCase: UploadKavlingDocumentUseCase,
    private readonly uploadSertifikatTambahanUseCase: UploadKavlingSertifikatTambahanDocumentUseCase,
    private readonly exportKavlingsUseCase: ExportKavlingsUseCase,
    private readonly exportKavlingPengeluaranUseCase: ExportKavlingPengeluaranUseCase,
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

  exportExcel = async (req: Request, res: Response): Promise<void> => {
    const filters = getKavlingExportSchema.query.parse(
      req.query,
    ) as KavlingFilterDTO;

    const excelBuffer = await this.exportKavlingsUseCase.execute(filters);
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `Data_Kavling_${timestamp}.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    res.status(StatusCodes.OK).send(excelBuffer);
  };

  exportPengeluaranExcel = async (req: Request, res: Response): Promise<void> => {
    const filters = getKavlingExportSchema.query.parse(
      req.query,
    ) as KavlingFilterDTO;

    const excelBuffer =
      await this.exportKavlingPengeluaranUseCase.execute(filters);
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `Pengeluaran_Kavling_${timestamp}.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    res.status(StatusCodes.OK).send(excelBuffer);
  };

  uploadSertifikatTambahanDocument = async (
    req: TypedRequest<any, any, typeof uploadKavlingSertifikatTambahanSchema.params>,
    res: Response,
  ): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    const urutan = parseInt(req.params.urutan, 10);
    const docType = req.params.docType;

    if (!req.file?.buffer) {
      sendResponse(res, StatusCodes.BAD_REQUEST, "File dokumen wajib diunggah");
      return;
    }

    const result = await this.uploadSertifikatTambahanUseCase.execute(
      id,
      urutan,
      req.file.buffer,
      docType,
    );
    sendResponse(
      res,
      StatusCodes.OK,
      `Dokumen sertifikat tanah ke-${urutan} (${docType}) berhasil diunggah`,
      result,
    );
  };
}
