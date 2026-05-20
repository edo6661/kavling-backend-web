import type { Response, Request } from "express";
import { StatusCodes } from "http-status-codes";
import { sendResponse } from "../../utils/response.js";
import type { TypedRequest } from "../../types/request.js";

import type {
  CreateTahapanLogUseCase,
  GetProgressProyekUseCase,
  UpdateProgressProyekUseCase,
  UploadTahapanPhotoUseCase,
} from "../../application/usecases/progressProyek/ProgressProyekUseCases.js";

import type {
  updateProgressProyekSchema,
  getProgressProyekSchema,
} from "../../validations/progressProyekSchema.js";

export class ProgressProyekController {
  constructor(
    private readonly getUseCase: GetProgressProyekUseCase,
    private readonly updateUseCase: UpdateProgressProyekUseCase,
    private readonly uploadUseCase: UploadTahapanPhotoUseCase,
    private readonly createTahapanLogUseCase: CreateTahapanLogUseCase,
  ) {}

  getByPenjualanId = async (
    req: TypedRequest<never, never, typeof getProgressProyekSchema.params>,
    res: Response,
  ): Promise<void> => {
    const penjualanId = parseInt(req.params.id, 10);
    const result = await this.getUseCase.execute(penjualanId);

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
    const result = await this.updateUseCase.execute(penjualanId, req.body);

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
    );

    sendResponse(
      res,
      StatusCodes.OK,
      `Foto untuk tahapan ${namaTahapan} berhasil diunggah`,
      result,
    );
  };
  addLog = async (
    req: Request, // Gunakan Request dari express
    res: Response,
  ): Promise<void> => {
    const penjualanId = parseInt(req.params.id as string, 10);
    const { namaTahapan, persentase, deskripsi, tanggal } = req.body;

    // Mengambil files dengan cara yang aman dari multer
    const files = req.files as Express.Multer.File[] | undefined;

    if (!files || files.length === 0) {
      sendResponse(res, StatusCodes.BAD_REQUEST, "File foto wajib diunggah");
      return;
    }

    const result = await this.createTahapanLogUseCase.execute(
      penjualanId,
      String(namaTahapan),
      Number(persentase),
      String(deskripsi ?? ""),
      String(tanggal),
      files.map((f) => f.buffer),
    );

    sendResponse(
      res,
      StatusCodes.OK,
      "Log tahapan berhasil ditambahkan",
      result,
    );
  };
}
