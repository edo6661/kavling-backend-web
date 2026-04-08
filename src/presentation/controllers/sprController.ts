import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { sendResponse } from "../../utils/response.js";
import type { TypedRequest } from "../../types/request.js";

import type { CreateSprUseCase } from "../../application/usecases/spr/CreateSprUseCase.js";
import type { UpdateSprUseCase } from "../../application/usecases/spr/UpdateSprUseCase.js";
import type { GetSprByIdUseCase } from "../../application/usecases/spr/GetSprByIdUseCase.js";
import type { GetSprsPaginatedUseCase } from "../../application/usecases/spr/GetSprsPaginatedUseCase.js";
import type { DeleteSprUseCase } from "../../application/usecases/spr/DeleteSprUseCase.js";
import type { UploadSprSignatureUseCase } from "../../application/usecases/spr/UploadSprSignatureUseCase.js";
import type { GenerateSprPdfUseCase } from "../../application/usecases/spr/GenerateSprPdfUseCase.js";
import type {
  createSprSchema,
  fastEntrySprSchema,
  updateSprSchema,
} from "../../validations/sprSchema.js";
import { getSprPaginatedSchema } from "../../validations/sprSchema.js";
import type { SprFilterDTO } from "../../domain/dtos/SprDTO.js";
import type { CancelSprUseCase } from "../../application/usecases/spr/CancelSprUseCase.js";
import type { cancelSprSchema } from "../../validations/sprSchema.js";
import type { ExportSprUseCase } from "../../application/usecases/spr/ExportSprUseCase.js";
import type { ExportSprPdfUseCase } from "../../application/usecases/spr/ExportSprPdfUseCase.js";
import type { CreateFastEntrySprUseCase } from "../../application/usecases/spr/CreateFastEntrySprUseCase.js";

export class SprController {
  constructor(
    private readonly createUseCase: CreateSprUseCase,
    private readonly createFastEntryUseCase: CreateFastEntrySprUseCase,
    private readonly updateUseCase: UpdateSprUseCase,
    private readonly getByIdUseCase: GetSprByIdUseCase,
    private readonly getPaginatedUseCase: GetSprsPaginatedUseCase,
    private readonly deleteUseCase: DeleteSprUseCase,
    private readonly uploadSignatureUseCase: UploadSprSignatureUseCase,
    private readonly generatePdfUseCase: GenerateSprPdfUseCase,
    private readonly cancelUseCase: CancelSprUseCase,
    private readonly exportSprUseCase: ExportSprUseCase,
    private readonly exportSprPdfUseCase: ExportSprPdfUseCase,
  ) {}
  create = async (
    req: TypedRequest<typeof createSprSchema.body>,
    res: Response,
  ): Promise<void> => {
    const marketingId = req.body.marketingUserId ?? req.user?.userId;

    const payload = {
      ...req.body,
      marketingUserId: marketingId,
    };

    const result = await this.createUseCase.execute(payload as any);

    sendResponse(res, StatusCodes.CREATED, "SPR berhasil dibuat", result);
  };

  update = async (
    req: TypedRequest<
      typeof updateSprSchema.body,
      any,
      typeof updateSprSchema.params
    >,
    res: Response,
  ): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    const result = await this.updateUseCase.execute(id, req.body);
    sendResponse(res, StatusCodes.OK, "Data SPR berhasil diperbarui", result);
  };

  getById = async (
    req: TypedRequest<any, any, typeof updateSprSchema.params>,
    res: Response,
  ): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    const result = await this.getByIdUseCase.execute(id);
    sendResponse(res, StatusCodes.OK, "Data SPR berhasil diambil", result);
  };

  getPaginated = async (req: Request, res: Response): Promise<void> => {
    const { limit, cursor, ...filters } = getSprPaginatedSchema.query.parse(
      req.query,
    );
    const parsedCursor = cursor ? Number(cursor) : undefined;

    const result = await this.getPaginatedUseCase.execute(
      limit,
      parsedCursor,
      filters as SprFilterDTO,
    );
    sendResponse(res, StatusCodes.OK, "Daftar SPR berhasil diambil", result);
  };

  delete = async (
    req: TypedRequest<any, any, typeof updateSprSchema.params>,
    res: Response,
  ): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    await this.deleteUseCase.execute(id);
    sendResponse(res, StatusCodes.OK, "Data SPR berhasil dihapus");
  };

  uploadSignature = async (req: Request, res: Response): Promise<void> => {
    const idParam = req.params.id as string;
    const roleParam = req.params.role as string;

    const id = parseInt(idParam, 10);

    if (isNaN(id)) {
      sendResponse(res, StatusCodes.BAD_REQUEST, "ID tidak valid");
      return;
    }

    const validRoles = [
      "pemesan",
      "marketing",
      "supervisor",
      "manager",
      "salesAdmin",
    ];
    if (!validRoles.includes(roleParam)) {
      sendResponse(
        res,
        StatusCodes.BAD_REQUEST,
        "Parameter role harus berupa pemesan, marketing, supervisor, manager, atau salesAdmin",
      );
      return;
    }

    if (!req.file?.buffer) {
      sendResponse(
        res,
        StatusCodes.BAD_REQUEST,
        "File tanda tangan wajib diunggah",
      );
      return;
    }

    const result = await this.uploadSignatureUseCase.execute(
      id,
      req.file.buffer,
      roleParam as
        | "pemesan"
        | "marketing"
        | "supervisor"
        | "manager"
        | "salesAdmin",
    );

    sendResponse(res, StatusCodes.OK, "Tanda tangan berhasil diunggah", result);
  };
  generatePdf = async (
    req: TypedRequest<any, any, typeof updateSprSchema.params>,
    res: Response,
  ): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    const pdfBuffer = await this.generatePdfUseCase.execute(id);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=SPR-${id}.pdf`);
    res.status(StatusCodes.OK).send(pdfBuffer);
  };
  cancel = async (
    req: TypedRequest<
      typeof cancelSprSchema.body,
      any,
      typeof cancelSprSchema.params
    >,
    res: Response,
  ): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    const { alasanBatal } = req.body;

    const result = await this.cancelUseCase.execute(id, alasanBatal);
    sendResponse(
      res,
      StatusCodes.OK,
      "Data SPR berhasil dibatalkan dan Unit kembali tersedia",
      result,
    );
  };
  exportExcel = async (_req: Request, res: Response): Promise<void> => {
    const excelBuffer = await this.exportSprUseCase.execute();
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `Data_SPR_${timestamp}.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    res.status(StatusCodes.OK).send(excelBuffer);
  };

  exportPdfList = async (_req: Request, res: Response): Promise<void> => {
    const pdfBuffer = await this.exportSprPdfUseCase.execute();
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `Data_SPR_${timestamp}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    res.status(StatusCodes.OK).send(pdfBuffer);
  };
  createFastEntry = async (
    req: TypedRequest<typeof fastEntrySprSchema.body>,
    res: Response,
  ): Promise<void> => {
    // Ambil marketing ID dari token jika tidak dikirim dari form
    const marketingId = req.body.marketingUserId ?? req.user?.userId;

    const payload = {
      ...req.body,
      marketingUserId: marketingId,
    };

    // Ekstrak file dari Multer
    const files = req.files as
      | Record<string, Express.Multer.File[]>
      | undefined;

    const fileBuffers = {
      fileKtp: files?.fileKtp?.[0]?.buffer,
      fileKk: files?.fileKk?.[0]?.buffer,
      fileNpwp: files?.fileNpwp?.[0]?.buffer,
      buktiTransferBookingFee: files?.buktiTransferBookingFee?.[0]?.buffer,
      buktiTransferClosingFee: files?.buktiTransferClosingFee?.[0]?.buffer,
      buktiTransferMarketingFee: files?.buktiTransferMarketingFee?.[0]?.buffer,
    };

    // PASTIKAN fileBuffers DIKIRIM KE SINI
    const result = await this.createFastEntryUseCase.execute(
      payload,
      fileBuffers,
    );

    sendResponse(
      res,
      StatusCodes.CREATED,
      "Data Fast Entry SPR berhasil disimpan",
      result,
    );
  };
}
