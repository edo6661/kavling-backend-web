// src/presentation/controllers/masterDataProgressController.ts
import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { sendResponse } from "../../utils/response.js";
import type { TypedRequest } from "../../types/request.js";

import type {
  CreateMasterDataProgressUseCase,
  UpdateMasterDataProgressUseCase,
  GetMasterDataProgressByIdUseCase,
  GetMasterDataProgressBySprIdUseCase,
  GetMasterDataProgressPaginatedUseCase,
} from "../../application/usecases/masterDataProgress/MasterDataProgressUseCases.js";

import type {
  createMasterDataProgressSchema,
  updateMasterDataProgressSchema,
} from "../../validations/masterDataProgressSchema.js";
import { getMasterDataProgressPaginatedSchema } from "../../validations/masterDataProgressSchema.js";
import type { MasterDataProgressFilterDTO } from "../../domain/dtos/MasterDataProgressDTO.js";
import type { UploadMasterDataProgressDocumentUseCase } from "../../application/usecases/masterDataProgress/UploadMasterDataProgressDocumentUseCase.js";
import type { ExportMasterDataUseCase } from "../../application/usecases/masterDataProgress/ExportMasterDataUseCase.js";
import type { ExportMasterDataPdfUseCase } from "../../application/usecases/masterDataProgress/ExportMasterDataPdfUseCase.js";

export class MasterDataProgressController {
  constructor(
    private readonly createUseCase: CreateMasterDataProgressUseCase,
    private readonly updateUseCase: UpdateMasterDataProgressUseCase,
    private readonly getByIdUseCase: GetMasterDataProgressByIdUseCase,
    private readonly getBySprIdUseCase: GetMasterDataProgressBySprIdUseCase,
    private readonly getPaginatedUseCase: GetMasterDataProgressPaginatedUseCase,
    private readonly uploadDocumentUseCase: UploadMasterDataProgressDocumentUseCase,
    private readonly exportMasterDataUseCase: ExportMasterDataUseCase,
    private readonly exportMasterDataPdfUseCase: ExportMasterDataPdfUseCase,
  ) {}

  create = async (
    req: TypedRequest<typeof createMasterDataProgressSchema.body>,
    res: Response,
  ): Promise<void> => {
    const result = await this.createUseCase.execute(req.body);
    sendResponse(
      res,
      StatusCodes.CREATED,
      "Master Data Progress berhasil diinisiasi",
      result,
    );
  };

  update = async (
    req: TypedRequest<
      typeof updateMasterDataProgressSchema.body,
      any,
      typeof updateMasterDataProgressSchema.params
    >,
    res: Response,
  ): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    const result = await this.updateUseCase.execute(id, req.body);
    sendResponse(
      res,
      StatusCodes.OK,
      "Master Data Progress berhasil diperbarui",
      result,
    );
  };

  getById = async (
    req: TypedRequest<any, any, typeof updateMasterDataProgressSchema.params>,
    res: Response,
  ): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    const result = await this.getByIdUseCase.execute(id);
    sendResponse(res, StatusCodes.OK, "Data progress berhasil diambil", result);
  };

  getBySprId = async (
    req: TypedRequest<any, any, typeof updateMasterDataProgressSchema.params>,
    res: Response,
  ): Promise<void> => {
    const sprId = parseInt(req.params.id, 10);
    if (isNaN(sprId)) {
      sendResponse(
        res,
        StatusCodes.BAD_REQUEST,
        "Parameter sprId harus berupa angka",
      );
      return;
    }
    const result = await this.getBySprIdUseCase.execute(sprId);
    sendResponse(
      res,
      StatusCodes.OK,
      "Data progress untuk SPR tersebut berhasil diambil",
      result,
    );
  };

  getPaginated = async (req: Request, res: Response): Promise<void> => {
    const { limit, cursor, ...filters } =
      getMasterDataProgressPaginatedSchema.query.parse(req.query);
    const parsedCursor = cursor ? Number(cursor) : undefined;

    const result = await this.getPaginatedUseCase.execute(
      limit,
      parsedCursor,
      filters as MasterDataProgressFilterDTO,
    );
    sendResponse(
      res,
      StatusCodes.OK,
      "Daftar progress berhasil diambil",
      result,
    );
  };
  uploadDocument = async (req: Request, res: Response): Promise<void> => {
    const idParam = req.params.id as string;
    const docType = req.params.docType as string;
    const id = parseInt(idParam, 10);

    if (isNaN(id)) {
      sendResponse(res, StatusCodes.BAD_REQUEST, "ID tidak valid");
      return;
    }

    if (
      ![
        "buktiTransferClosingFee",
        "buktiTransferMarketingFee",
        "buktiTransferBookingFee",
      ].includes(docType)
    ) {
      sendResponse(
        res,
        StatusCodes.BAD_REQUEST,
        "Parameter docType harus berupa buktiTransferClosingFee atau buktiTransferMarketingFee atau buktiTransferBookingFee",
      );
      return;
    }

    if (!req.file?.buffer) {
      sendResponse(
        res,
        StatusCodes.BAD_REQUEST,
        "File bukti transfer wajib diunggah",
      );
      return;
    }

    const result = await this.uploadDocumentUseCase.execute(
      id,
      req.file.buffer,
      docType as "buktiTransferClosingFee" | "buktiTransferMarketingFee",
    );

    sendResponse(
      res,
      StatusCodes.OK,
      "Bukti transfer berhasil diunggah",
      result,
    );
  };
  exportExcel = async (_req: Request, res: Response): Promise<void> => {
    const excelBuffer = await this.exportMasterDataUseCase.execute();

    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `Master_Data_Progress_${timestamp}.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    res.status(StatusCodes.OK).send(excelBuffer);
  };
  exportPdf = async (_req: Request, res: Response): Promise<void> => {
    const pdfBuffer = await this.exportMasterDataPdfUseCase.execute();

    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `Master_Data_Progress_${timestamp}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    res.status(StatusCodes.OK).send(pdfBuffer);
  };
}
