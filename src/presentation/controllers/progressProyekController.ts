import type { Response, Request } from "express";
import { StatusCodes } from "http-status-codes";
import { sendResponse } from "../../utils/response.js";
import type { TypedRequest } from "../../types/request.js";

import type {
  CreateTahapanLogByKavlingUseCase,
  CreateTahapanLogBySpkUseCase,
  CreateTahapanLogUseCase,
  GetProgressInfraBySpkUseCase,
  GetProgressInfraListPaginatedUseCase,
  GetProgressProyekByKavlingUseCase,
  GetProgressProyekListPaginatedUseCase,
  GetProgressProyekUseCase,
  ListMandorsUseCase,
  GetMandorRekeningUseCase,
  UpdateProgressProyekUseCase,
  UploadTahapanPhotoByKavlingUseCase,
  UploadTahapanPhotoUseCase,
  SetTotalProgressByKavlingUseCase,
  ResetTotalProgressByKavlingUseCase,
  SetTotalProgressBySpkUseCase,
  ResetTotalProgressBySpkUseCase,
} from "../../application/usecases/progressProyek/ProgressProyekUseCases.js";
import type {
  ProgressProyekListFilterDTO,
  ProgressInfraListFilterDTO,
} from "../../domain/dtos/ProgressProyekDTO.js";
import { getProgressProyekListSchema, getProgressInfraListSchema } from "../../validations/progressProyekSchema.js";
import { Role } from "@prisma/client";
import type { ProgressRequestContext } from "../../application/usecases/progressProyek/mandorAccess.js";
import type { UpdateProgressProyekDTO } from "../../domain/dtos/ProgressProyekDTO.js";

import type {
  getProgressProyekByKavlingSchema,
  updateProgressProyekSchema,
  getProgressProyekSchema,
  setTotalProgressByKavlingSchema,
  resetTotalProgressByKavlingSchema,
  getProgressInfraBySpkSchema,
  addTahapanLogBySpkSchema,
  setTotalProgressBySpkSchema,
  resetTotalProgressBySpkSchema,
} from "../../validations/progressProyekSchema.js";

export class ProgressProyekController {
  constructor(
    private readonly getListUseCase: GetProgressProyekListPaginatedUseCase,
    private readonly getInfraListUseCase: GetProgressInfraListPaginatedUseCase,
    private readonly getUseCase: GetProgressProyekUseCase,
    private readonly getByKavlingUseCase: GetProgressProyekByKavlingUseCase,
    private readonly getInfraBySpkUseCase: GetProgressInfraBySpkUseCase,
    private readonly updateUseCase: UpdateProgressProyekUseCase,
    private readonly uploadUseCase: UploadTahapanPhotoUseCase,
    private readonly uploadByKavlingUseCase: UploadTahapanPhotoByKavlingUseCase,
    private readonly createTahapanLogUseCase: CreateTahapanLogUseCase,
    private readonly createTahapanLogByKavlingUseCase: CreateTahapanLogByKavlingUseCase,
    private readonly createTahapanLogBySpkUseCase: CreateTahapanLogBySpkUseCase,
    private readonly listMandorsUseCase: ListMandorsUseCase,
    private readonly getMandorRekeningUseCase: GetMandorRekeningUseCase,
    private readonly setTotalByKavlingUseCase: SetTotalProgressByKavlingUseCase,
    private readonly resetTotalByKavlingUseCase: ResetTotalProgressByKavlingUseCase,
    private readonly setTotalBySpkUseCase: SetTotalProgressBySpkUseCase,
    private readonly resetTotalBySpkUseCase: ResetTotalProgressBySpkUseCase,
  ) {}

  private requestContext(req: Request): ProgressRequestContext {
    const ctx: ProgressRequestContext = {};
    if (req.user?.role !== undefined) ctx.role = req.user.role;
    if (req.user?.userId !== undefined) ctx.userId = req.user.userId;
    return ctx;
  }

  listMandors = async (_req: Request, res: Response): Promise<void> => {
    const result = await this.listMandorsUseCase.execute();
    sendResponse(res, StatusCodes.OK, "Daftar mandor berhasil diambil", result);
  };

  getMandorRekening = async (req: Request, res: Response): Promise<void> => {
    const userId = Number(req.params.userId);
    const result = await this.getMandorRekeningUseCase.execute(userId);
    sendResponse(res, StatusCodes.OK, "Daftar rekening mandor berhasil diambil", result);
  };

  getProyekList = async (req: Request, res: Response): Promise<void> => {
    const { page, limit, search, orderBy } =
      getProgressProyekListSchema.query.parse(req.query);

    const filters: ProgressProyekListFilterDTO = {};
    if (req.user?.role === Role.MANDOR && req.user.userId) {
      filters.mandorUserId = req.user.userId;
    }
    if (search) {
      filters.search = search;
    }
    if (orderBy?.field) {
      filters.orderBy = {
        field: orderBy.field,
        direction: orderBy.direction,
      };
    }

    const result = await this.getListUseCase.execute(page, limit, filters);

    sendResponse(
      res,
      StatusCodes.OK,
      "Daftar proyek progress berhasil diambil",
      result,
    );
  };

  getInfraProyekList = async (req: Request, res: Response): Promise<void> => {
    const { page, limit, search, orderBy } =
      getProgressInfraListSchema.query.parse(req.query);

    const filters: ProgressInfraListFilterDTO = {};
    if (req.user?.role === Role.MANDOR && req.user.userId) {
      filters.mandorUserId = req.user.userId;
    }
    if (search) {
      filters.search = search;
    }
    if (orderBy?.field) {
      filters.orderBy = {
        field: orderBy.field,
        direction: orderBy.direction,
      };
    }

    const result = await this.getInfraListUseCase.execute(page, limit, filters);

    sendResponse(
      res,
      StatusCodes.OK,
      "Daftar progress infrastruktur berhasil diambil",
      result,
    );
  };

  getInfraBySpkId = async (
    req: TypedRequest<never, never, typeof getProgressInfraBySpkSchema.params>,
    res: Response,
  ): Promise<void> => {
    const spkId = parseInt(req.params.spkId, 10);
    const result = await this.getInfraBySpkUseCase.execute(
      spkId,
      this.requestContext(req),
    );

    sendResponse(
      res,
      StatusCodes.OK,
      "Data progress infrastruktur berhasil diambil",
      result,
    );
  };

  setTotalBySpkId = async (
    req: TypedRequest<
      typeof setTotalProgressBySpkSchema.body,
      never,
      typeof setTotalProgressBySpkSchema.params
    >,
    res: Response,
  ): Promise<void> => {
    const spkId = parseInt(req.params.spkId, 10);
    const result = await this.setTotalBySpkUseCase.execute(
      spkId,
      Number(req.body.persentase),
      this.requestContext(req),
    );

    sendResponse(
      res,
      StatusCodes.OK,
      "Total progress infrastruktur berhasil diperbarui",
      result,
    );
  };

  resetTotalBySpkId = async (
    req: TypedRequest<
      never,
      never,
      typeof resetTotalProgressBySpkSchema.params
    >,
    res: Response,
  ): Promise<void> => {
    const spkId = parseInt(req.params.spkId, 10);
    const result = await this.resetTotalBySpkUseCase.execute(
      spkId,
      this.requestContext(req),
    );

    sendResponse(
      res,
      StatusCodes.OK,
      "Total progress infrastruktur berhasil direset ke default",
      result,
    );
  };

  addLogBySpk = async (req: Request, res: Response): Promise<void> => {
    const spkId = parseInt(req.params.spkId as string, 10);
    const { namaTahapan, persentase, deskripsi, tanggal } = req.body;
    const files = req.files as Express.Multer.File[] | undefined;

    if (!files || files.length === 0) {
      sendResponse(res, StatusCodes.BAD_REQUEST, "File foto wajib diunggah");
      return;
    }

    const result = await this.createTahapanLogBySpkUseCase.execute(
      spkId,
      String(namaTahapan),
      Number(persentase),
      String(deskripsi ?? ""),
      String(tanggal),
      files.map((f) => f.buffer),
      req.user?.userId ?? null,
      this.requestContext(req),
    );

    sendResponse(
      res,
      StatusCodes.OK,
      "Log tahapan infrastruktur berhasil ditambahkan",
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

  getByKavlingId = async (
    req: TypedRequest<never, never, typeof getProgressProyekByKavlingSchema.params>,
    res: Response,
  ): Promise<void> => {
    const kavlingId = parseInt(req.params.kavlingId, 10);
    const result = await this.getByKavlingUseCase.execute(
      kavlingId,
      this.requestContext(req),
    );

    sendResponse(
      res,
      StatusCodes.OK,
      "Data progress proyek berhasil diambil",
      result,
    );
  };

  setTotalByKavlingId = async (
    req: TypedRequest<
      typeof setTotalProgressByKavlingSchema.body,
      never,
      typeof setTotalProgressByKavlingSchema.params
    >,
    res: Response,
  ): Promise<void> => {
    const kavlingId = parseInt(req.params.kavlingId, 10);
    const result = await this.setTotalByKavlingUseCase.execute(
      kavlingId,
      Number(req.body.persentase),
      this.requestContext(req),
    );

    sendResponse(
      res,
      StatusCodes.OK,
      "Total progress berhasil diperbarui",
      result,
    );
  };

  resetTotalByKavlingId = async (
    req: TypedRequest<
      never,
      never,
      typeof resetTotalProgressByKavlingSchema.params
    >,
    res: Response,
  ): Promise<void> => {
    const kavlingId = parseInt(req.params.kavlingId, 10);
    const result = await this.resetTotalByKavlingUseCase.execute(
      kavlingId,
      this.requestContext(req),
    );

    sendResponse(
      res,
      StatusCodes.OK,
      "Total progress berhasil direset ke default",
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
    const updateDto: UpdateProgressProyekDTO = req.body.tahapan
      ? {
          tahapan: req.body.tahapan.map((t) => ({
            ...t,
            deskripsi: t.deskripsi ?? null,
          })),
        }
      : {};
    const result = await this.updateUseCase.execute(
      penjualanId,
      updateDto,
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

  uploadPhotoByKavling = async (req: Request, res: Response): Promise<void> => {
    const kavlingId = parseInt(req.params.kavlingId as string, 10);
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

    const result = await this.uploadByKavlingUseCase.execute(
      kavlingId,
      namaTahapan,
      files.map((f) => f.buffer),
      this.requestContext(req),
    );

    sendResponse(
      res,
      StatusCodes.OK,
      `Foto untuk tahapan ${namaTahapan} berhasil diunggah`,
      result,
    );
  };

  addLogByKavling = async (req: Request, res: Response): Promise<void> => {
    const kavlingId = parseInt(req.params.kavlingId as string, 10);
    const { namaTahapan, persentase, deskripsi, tanggal } = req.body;
    const files = req.files as Express.Multer.File[] | undefined;

    if (!files || files.length === 0) {
      sendResponse(res, StatusCodes.BAD_REQUEST, "File foto wajib diunggah");
      return;
    }

    const result = await this.createTahapanLogByKavlingUseCase.execute(
      kavlingId,
      String(namaTahapan),
      Number(persentase),
      String(deskripsi ?? ""),
      String(tanggal),
      files.map((f) => f.buffer),
      req.user?.userId ?? null,
      this.requestContext(req),
    );

    sendResponse(
      res,
      StatusCodes.OK,
      "Log tahapan berhasil ditambahkan",
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
