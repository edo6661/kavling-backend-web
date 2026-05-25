import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { sendResponse } from "../../utils/response.js";
import type { TypedRequest } from "../../types/request.js";
import type {
  UploadSuketPphUseCase,
  GetSuketPphByPenjualanUseCase,
} from "../../application/usecases/suketPph/SuketPphUseCases.js";
import type { uploadSuketPphSchema } from "../../validations/suketPphSchema.js";
import { AppError } from "../../domain/errors/AppError.js";

export class SuketPphController {
  constructor(
    private readonly uploadUseCase: UploadSuketPphUseCase,
    private readonly getByPenjualanUseCase: GetSuketPphByPenjualanUseCase,
  ) {}

  upload = async (
    req: TypedRequest<typeof uploadSuketPphSchema.body>,
    res: Response,
  ): Promise<void> => {
    const file = req.file;
    if (!file?.buffer) {
      throw new AppError(StatusCodes.BAD_REQUEST, "File wajib diunggah");
    }

    const userId = (req as Request & { user?: { userId: number } }).user?.userId;

    const result = await this.uploadUseCase.execute({
      customerId: req.body.customerId,
      penjualanId: req.body.penjualanId,
      fileBuffer: file.buffer,
      pdfPassword: req.body.pdfPassword,
      uploadedBy: userId,
    });

    sendResponse(res, StatusCodes.CREATED, "Suket PPh berhasil disimpan", result);
  };

  getByPenjualan = async (req: Request, res: Response): Promise<void> => {
    const penjualanId = parseInt(req.params.penjualanId as string, 10);
    const result = await this.getByPenjualanUseCase.execute(penjualanId);
    sendResponse(
      res,
      StatusCodes.OK,
      result ? "Data suket PPh berhasil diambil" : "Belum ada suket PPh",
      result,
    );
  };
}
