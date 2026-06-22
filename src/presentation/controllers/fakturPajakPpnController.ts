import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { sendResponse } from "../../utils/response.js";
import type { TypedRequest } from "../../types/request.js";
import type {
  UploadFakturPajakPpnUseCase,
  GetFakturPajakPpnByPenjualanUseCase,
  GetAllFakturPajakPpnByPenjualanUseCase,
} from "../../application/usecases/fakturPajakPpn/FakturPajakPpnUseCases.js";
import type { uploadFakturPajakPpnSchema } from "../../validations/fakturPajakPpnSchema.js";
import { AppError } from "../../domain/errors/AppError.js";
import { omitUndefined } from "../../utils/object.js";

export class FakturPajakPpnController {
  constructor(
    private readonly uploadUseCase: UploadFakturPajakPpnUseCase,
    private readonly getByPenjualanUseCase: GetFakturPajakPpnByPenjualanUseCase,
    private readonly getAllByPenjualanUseCase: GetAllFakturPajakPpnByPenjualanUseCase,
  ) {}

  upload = async (
    req: TypedRequest<typeof uploadFakturPajakPpnSchema.body>,
    res: Response,
  ): Promise<void> => {
    const file = req.file;
    if (!file?.buffer) {
      throw new AppError(StatusCodes.BAD_REQUEST, "File wajib diunggah");
    }

    const userId = (req as Request & { user?: { userId: number } }).user?.userId;

    const result = await this.uploadUseCase.execute(
      omitUndefined({
        customerId: req.body.customerId,
        penjualanId: req.body.penjualanId,
        sertifikatUrutan: req.body.sertifikatUrutan,
        fileBuffer: file.buffer,
        pdfPassword: req.body.pdfPassword,
        uploadedBy: userId,
      }),
    );

    sendResponse(
      res,
      StatusCodes.CREATED,
      "Faktur pajak PPN berhasil disimpan",
      result,
    );
  };

  getByPenjualan = async (req: Request, res: Response): Promise<void> => {
    const penjualanId = parseInt(req.params.penjualanId as string, 10);
    const result = await this.getByPenjualanUseCase.execute(penjualanId);
    sendResponse(
      res,
      StatusCodes.OK,
      result ? "Data faktur pajak PPN berhasil diambil" : "Belum ada faktur pajak PPN",
      result,
    );
  };

  getAllByPenjualan = async (req: Request, res: Response): Promise<void> => {
    const penjualanId = parseInt(req.params.penjualanId as string, 10);
    const result = await this.getAllByPenjualanUseCase.execute(penjualanId);
    sendResponse(
      res,
      StatusCodes.OK,
      "Daftar faktur pajak PPN berhasil diambil",
      result,
    );
  };
}
