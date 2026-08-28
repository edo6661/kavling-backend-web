import type { Request, Response } from "express";
import { Role } from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import { AppError } from "../../domain/errors/AppError.js";
import { sendResponse } from "../../utils/response.js";
import type { TypedRequest } from "../../types/request.js";
import type {
  CreateSpkUseCase,
  UpdateSpkUseCase,
  GetSpkByIdUseCase,
  GetSpkPaginatedUseCase,
  DeleteSpkUseCase,
  ApproveSpkUseCase,
  RejectSpkUseCase,
} from "../../application/usecases/spk/SpkUseCases.js";
import type { ExportSpksUseCase } from "../../application/usecases/spk/ExportSpksUseCase.js";
import type {
  createSpkSchema,
  updateSpkSchema,
  rejectSpkSchema,
} from "../../validations/spkSchema.js";
import {
  getSpkExportSchema,
  getSpkPaginatedSchema,
} from "../../validations/spkSchema.js";
import type { getSpkByIdSchema } from "../../validations/spkSchema.js";
import type { SpkFilterDTO } from "../../domain/dtos/SpkDTO.js";
import { omitUndefined } from "../../utils/object.js";
import { getSpkUploadBuffers } from "../../utils/spkUpload.js";

export class SpkController {
  constructor(
    private readonly createUseCase: CreateSpkUseCase,
    private readonly updateUseCase: UpdateSpkUseCase,
    private readonly getByIdUseCase: GetSpkByIdUseCase,
    private readonly getPaginatedUseCase: GetSpkPaginatedUseCase,
    private readonly deleteUseCase: DeleteSpkUseCase,
    private readonly approveUseCase: ApproveSpkUseCase,
    private readonly rejectUseCase: RejectSpkUseCase,
    private readonly exportSpksUseCase: ExportSpksUseCase,
  ) {}

  create = async (
    req: TypedRequest<typeof createSpkSchema.body>,
    res: Response,
  ): Promise<void> => {
    const { fileSpkBuffer, fileRabBuffer } = getSpkUploadBuffers(req);
    const result = await this.createUseCase.execute(
      omitUndefined(req.body),
      fileSpkBuffer,
      fileRabBuffer,
      req.user?.userId,
    );
    sendResponse(res, StatusCodes.CREATED, "SPK berhasil diajukan dan menunggu persetujuan", result);
  };

  update = async (
    req: TypedRequest<
      typeof updateSpkSchema.body,
      never,
      typeof updateSpkSchema.params
    >,
    res: Response,
  ): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    const { fileSpkBuffer, fileRabBuffer } = getSpkUploadBuffers(req);
    const result = await this.updateUseCase.execute(
      id,
      omitUndefined(req.body),
      fileSpkBuffer,
      fileRabBuffer,
    );
    sendResponse(res, StatusCodes.OK, "SPK berhasil diperbarui", result);
  };

  getById = async (
    req: TypedRequest<never, never, typeof updateSpkSchema.params>,
    res: Response,
  ): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    const result = await this.getByIdUseCase.execute(id);
    if (req.user?.role === Role.MANDOR && result.mandorId !== req.user.userId) {
      throw new AppError(StatusCodes.FORBIDDEN, "Anda tidak memiliki akses ke SPK ini");
    }
    sendResponse(res, StatusCodes.OK, "Data SPK berhasil diambil", result);
  };

  getPaginated = async (req: Request, res: Response): Promise<void> => {
    const { page, limit, search, orderBy, jenis, statusApproval } =
      getSpkPaginatedSchema.query.parse(req.query);

    const filters: SpkFilterDTO = {};
    if (search) filters.search = search;
    if (orderBy) filters.orderBy = orderBy;
    if (jenis) filters.jenis = jenis;
    if (statusApproval) filters.statusApproval = statusApproval;
    if (req.user?.role === Role.MANDOR && req.user.userId) {
      filters.mandorId = req.user.userId;
    }

    const result = await this.getPaginatedUseCase.execute(page, limit, filters);
    sendResponse(res, StatusCodes.OK, "Daftar SPK berhasil diambil", result);
  };

  exportExcel = async (req: Request, res: Response): Promise<void> => {
    const { orderBy } = getSpkExportSchema.query.parse(req.query);
    const mandorId =
      req.user?.role === Role.MANDOR ? req.user.userId : undefined;
    const excelBuffer = await this.exportSpksUseCase.execute(
      orderBy || mandorId
        ? {
            ...(orderBy ? { orderBy } : {}),
            ...(mandorId ? { mandorId } : {}),
          }
        : undefined,
    );
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `Rekap_SPK_Disetujui_${timestamp}.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    res.status(StatusCodes.OK).send(excelBuffer);
  };

  approve = async (
    req: TypedRequest<never, never, typeof getSpkByIdSchema.params>,
    res: Response,
  ): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    const result = await this.approveUseCase.execute(
      id,
      req.user!.userId,
      req.user!.role,
    );
    sendResponse(res, StatusCodes.OK, "SPK berhasil disetujui", result);
  };

  reject = async (
    req: TypedRequest<typeof rejectSpkSchema.body, never, typeof getSpkByIdSchema.params>,
    res: Response,
  ): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    const result = await this.rejectUseCase.execute(
      id,
      req.user!.userId,
      req.user!.role,
      req.body.catatanPenolakan,
    );
    sendResponse(res, StatusCodes.OK, "SPK ditolak", result);
  };

  delete = async (
    req: TypedRequest<never, never, typeof updateSpkSchema.params>,
    res: Response,
  ): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    await this.deleteUseCase.execute(id);
    sendResponse(res, StatusCodes.OK, "SPK berhasil dihapus");
  };
}
