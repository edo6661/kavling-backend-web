import type { Response, Request } from "express";
import { StatusCodes } from "http-status-codes";
import { sendResponse } from "../../utils/response.js";
import type { TypedRequest } from "../../types/request.js";

import type {
  CreateTahapanLogUseCase,
  GetProgressProyekListPaginatedUseCase,
  GetProgressProyekUseCase,
  ListMandorsUseCase,
  UpdateProgressProyekUseCase,
  UploadTahapanPhotoUseCase,
} from "../../application/usecases/progressProyek/ProgressProyekUseCases.js";
import type { ProgressProyekListFilterDTO } from "../../domain/dtos/ProgressProyekDTO.js";
import { getProgressProyekListSchema } from "../../validations/progressProyekSchema.js";
import { Role } from "@prisma/client";
import type { ProgressRequestContext } from "../../application/usecases/progressProyek/mandorAccess.js";

import type {
  updateProgressProyekSchema,
  getProgressProyekSchema,
} from "../../validations/progressProyekSchema.js";

export class ProgressProyekController {
  constructor(
    private readonly getListUseCase: GetProgressProyekListPaginatedUseCase,
    private readonly getUseCase: GetProgressProyekUseCase,
    private readonly updateUseCase: UpdateProgressProyekUseCase,
    private readonly uploadUseCase: UploadTahapanPhotoUseCase,
    private readonly createTahapanLogUseCase: CreateTahapanLogUseCase,
    private readonly listMandorsUseCase: ListMandorsUseCase,
  ) {}

  private requestContext(req: Request): ProgressRequestContext {
    return { role: req.user?.role, userId: req.user?.userId };
  }

  listMandors = async (_req: Request, res: Response): Promise<void> => {
    const result = await this.listMandorsUseCase.execute();
    sendResponse(res, StatusCodes.OK, "Daftar mandor berhasil diambil", result);
  };

  getProyekList = async (req: Request, res: Response): Promise<void> => {
    const { page, limit } = getProgressProyekListSchema.query.parse(req.query);

    const filters: ProgressProyekListFilterDTO = {};
    if (req.user?.role === Role.MANDOR && req.user.userId) {
      filters.mandorUserId = req.user.userId;
    }

    const result = await this.getListUseCase.execute(page, limit, filters);

    sendResponse(
      res,
      StatusCodes.OK,
      "Daftar proyek progress berhasil diambil",
      result,
    );
  };

  getByPenjualanId = async (
    req: TypedRequest<never, never, typeof getProgressProyekSchema.params>,
    res: Response,
  ): Promise<void> => {
    const penjualanId = parseInt(req.params.id, 10);
    const result = await this.getUseCase.execute(
      penjualanId,
      this.requestContext(req),
    );

    sendResponse(
      res,
      StatusCodes.OK,
      "Data progress proyek berhasil diambil",
      result,
    );
  };

  update = async (
    req: TypedRequest<
      typeof updateProgressProyekSchema.body,
      never,
      typeof updateProgressProyekSchema.params
    >,
    res: Response,
  ): Promise<void> => {
    const penjualanId = parseInt(req.params.id, 10);
    const result = await this.updateUseCase.execute(
      penjualanId,
      req.body,
      this.requestContext(req),
    );

    sendResponse(
      res,
      StatusCodes.OK,
      "Data progress proyek berhasil diperbarui",
      result,
    );
  };

  uploadPhoto = async (req: Request, res: Response): Promise<void> => {
    const penjualanId = parseInt(req.params.id as string, 10);
    const namaTahapan = req.params.namaTahapan as string;

    const files = req.files as Express.Multer.File[] | undefined;

    if (!files || files.length === 0) {
      sendResponse(
        res,
        StatusCodes.BAD_REQUEST,
        "File foto wajib diunggah (minimal 1)",
      );
      return;
    }

    const buffers = files.map((f) => f.buffer);

    const result = await this.uploadUseCase.execute(
      penjualanId,
      namaTahapan,
      buffers,
      this.requestContext(req),
    );

    sendResponse(
      res,
      StatusCodes.OK,
      `Foto untuk tahapan ${namaTahapan} berhasil diunggah`,
      result,
    );
  };

  addLog = async (req: Request, res: Response): Promise<void> => {
    const penjualanId = parseInt(req.params.id as string, 10);
    const { namaTahapan, persentase, deskripsi, tanggal } = req.body;

    const files = req.files as Express.Multer.File[] | undefined;

    if (!files || files.length === 0) {
      sendResponse(res, StatusCodes.BAD_REQUEST, "File foto wajib diunggah");
      return;
    }

    const reportedById = req.user?.userId ?? null;

    const result = await this.createTahapanLogUseCase.execute(
      penjualanId,
      String(namaTahapan),
      Number(persentase),
      String(deskripsi ?? ""),
      String(tanggal),
      files.map((f) => f.buffer),
      reportedById,
      this.requestContext(req),
    );

    sendResponse(
      res,
      StatusCodes.OK,
      "Log tahapan berhasil ditambahkan",
      result,
    );
  };
}
