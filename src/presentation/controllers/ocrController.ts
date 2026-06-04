import type { Response } from "express";
import { StatusCodes } from "http-status-codes";
import { sendResponse } from "../../utils/response.js";
import type { TypedRequest } from "../../types/request.js";
import type {
  ocrExtractSchema,
  ocrKasbonBonExtractSchema,
} from "../../validations/ocrSchema.js";
import type { ExtractKtpDataUseCase } from "../../application/usecases/ocr/ExtractKtpDataUseCase.js";
import type { ExtractKasbonBonDataUseCase } from "../../application/usecases/ocr/ExtractKasbonBonDataUseCase.js";

export class OcrController {
  constructor(
    private readonly extractKtpDataUseCase: ExtractKtpDataUseCase,
    private readonly extractKasbonBonDataUseCase: ExtractKasbonBonDataUseCase,
  ) {}

  extractKtpData = async (
    req: TypedRequest<typeof ocrExtractSchema.body>,
    res: Response,
  ): Promise<void> => {
    const fotoKtpBuffer = req.file?.buffer;

    if (!fotoKtpBuffer) {
      sendResponse(
        res,
        StatusCodes.BAD_REQUEST,
        "File foto KTP (foto_ktp) wajib diunggah.",
      );
      return;
    }

    const result = await this.extractKtpDataUseCase.execute(fotoKtpBuffer);

    sendResponse(res, StatusCodes.OK, "Berhasil mengekstrak data KTP", result);
  };

  extractKasbonBon = async (
    req: TypedRequest<typeof ocrKasbonBonExtractSchema.body>,
    res: Response,
  ): Promise<void> => {
    const fotoBonBuffer = req.file?.buffer;
    const mimeType = req.file?.mimetype ?? "image/jpeg";

    if (!fotoBonBuffer) {
      sendResponse(
        res,
        StatusCodes.BAD_REQUEST,
        "File foto bon (foto_bon) wajib diunggah.",
      );
      return;
    }

    const result = await this.extractKasbonBonDataUseCase.execute(
      fotoBonBuffer,
      mimeType,
    );

    sendResponse(
      res,
      StatusCodes.OK,
      "Berhasil mengekstrak data bon",
      result,
    );
  };
}
