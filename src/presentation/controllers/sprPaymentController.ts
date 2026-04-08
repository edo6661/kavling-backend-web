import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { sendResponse } from "../../utils/response.js";
import type { TypedRequest } from "../../types/request.js";

import type {
  CreateSprPaymentUseCase,
  UpdateSprPaymentUseCase,
  GetSprPaymentByIdUseCase,
  GetSprPaymentsPaginatedUseCase,
  DeleteSprPaymentUseCase,
  UploadBuktiTransferUseCase,
} from "../../application/usecases/sprPayment/SprPaymentUseCases.js";

import type { VerifySprPaymentUseCase } from "../../application/usecases/sprPayment/VerifySprPaymentUseCase.js";

import type {
  createSprPaymentSchema,
  updateSprPaymentSchema,
  verifySprPaymentSchema,
} from "../../validations/sprPaymentSchema.js";
import { getSprPaymentPaginatedSchema } from "../../validations/sprPaymentSchema.js";
import type { SprPaymentFilterDTO } from "../../domain/dtos/SprPaymentDTO.js";
import type { GenerateKwitansiPdfUseCase } from "../../application/usecases/sprPayment/GenerateKwitansiPdfUseCase.js";
import type { ExportFinanceReportUseCase } from "../../application/usecases/sprPayment/ExportFinanceReportUseCase.js";

export class SprPaymentController {
  constructor(
    private readonly createUseCase: CreateSprPaymentUseCase,
    private readonly updateUseCase: UpdateSprPaymentUseCase,
    private readonly getByIdUseCase: GetSprPaymentByIdUseCase,
    private readonly getPaginatedUseCase: GetSprPaymentsPaginatedUseCase,
    private readonly deleteUseCase: DeleteSprPaymentUseCase,
    private readonly uploadBuktiUseCase: UploadBuktiTransferUseCase,
    private readonly verifyPaymentUseCase: VerifySprPaymentUseCase,
    private readonly generateKwitansiPdfUseCase: GenerateKwitansiPdfUseCase,
    private readonly exportFinanceUseCase: ExportFinanceReportUseCase,
  ) {}

  create = async (
    req: TypedRequest<typeof createSprPaymentSchema.body>,
    res: Response,
  ): Promise<void> => {
    const result = await this.createUseCase.execute(req.body);
    sendResponse(
      res,
      StatusCodes.CREATED,
      "Jadwal pembayaran berhasil dibuat",
      result,
    );
  };

  update = async (
    req: TypedRequest<
      typeof updateSprPaymentSchema.body,
      any,
      typeof updateSprPaymentSchema.params
    >,
    res: Response,
  ): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    const result = await this.updateUseCase.execute(id, req.body);
    sendResponse(
      res,
      StatusCodes.OK,
      "Data pembayaran berhasil diperbarui",
      result,
    );
  };

  getById = async (
    req: TypedRequest<any, any, typeof updateSprPaymentSchema.params>,
    res: Response,
  ): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    const result = await this.getByIdUseCase.execute(id);
    sendResponse(
      res,
      StatusCodes.OK,
      "Data pembayaran berhasil diambil",
      result,
    );
  };

  getPaginated = async (req: Request, res: Response): Promise<void> => {
    const { limit, cursor, ...filters } =
      getSprPaymentPaginatedSchema.query.parse(req.query);
    const parsedCursor = cursor ? Number(cursor) : undefined;

    const result = await this.getPaginatedUseCase.execute(
      limit,
      parsedCursor,
      filters as SprPaymentFilterDTO,
    );
    sendResponse(
      res,
      StatusCodes.OK,
      "Daftar pembayaran berhasil diambil",
      result,
    );
  };

  delete = async (
    req: TypedRequest<any, any, typeof updateSprPaymentSchema.params>,
    res: Response,
  ): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    await this.deleteUseCase.execute(id);
    sendResponse(res, StatusCodes.OK, "Data pembayaran berhasil dihapus");
  };

  uploadBukti = async (
    req: TypedRequest<any, any, typeof updateSprPaymentSchema.params>,
    res: Response,
  ): Promise<void> => {
    const id = parseInt(req.params.id, 10);

    if (!req.file?.buffer) {
      sendResponse(
        res,
        StatusCodes.BAD_REQUEST,
        "File bukti_transfer wajib diunggah",
      );
      return;
    }

    const result = await this.uploadBuktiUseCase.execute(id, req.file.buffer);
    sendResponse(
      res,
      StatusCodes.OK,
      "Bukti transfer berhasil diunggah",
      result,
    );
  };

  verify = async (
    req: TypedRequest<
      typeof verifySprPaymentSchema.body,
      any,
      typeof verifySprPaymentSchema.params
    >,
    res: Response,
  ): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    const { isApproved } = req.body;

    const result = await this.verifyPaymentUseCase.execute(id, isApproved);

    const message = isApproved
      ? "Pembayaran berhasil diverifikasi dan disetujui"
      : "Pembayaran ditolak";

    sendResponse(res, StatusCodes.OK, message, result);
  };
  generateKwitansi = async (
    req: TypedRequest<
      typeof updateSprPaymentSchema.body,
      any,
      typeof updateSprPaymentSchema.params
    >,
    res: Response,
  ): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    const pdfBuffer = await this.generateKwitansiPdfUseCase.execute(id);

    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `Kwitansi_${id}_${timestamp}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    res.status(StatusCodes.OK).send(pdfBuffer);
  };
  exportFinanceExcel = async (_req: Request, res: Response): Promise<void> => {
    const buffer = await this.exportFinanceUseCase.execute();
    const timestamp = new Date().toISOString().slice(0, 10);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Laporan_Keuangan_${timestamp}.xlsx`,
    );
    res.status(StatusCodes.OK).send(buffer);
  };
}
