import type { Response } from "express";
import { StatusCodes } from "http-status-codes";
import { sendResponse } from "../../utils/response.js";
import type { TypedRequest } from "../../types/request.js";
import type { ocrExtractSchema } from "../../validations/ocrSchema.js";
import type { ExtractKtpDataUseCase } from "../../application/usecases/ocr/ExtractKtpDataUseCase.js";

export class OcrController {
  constructor(private readonly extractKtpDataUseCase: ExtractKtpDataUseCase) {}

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
}
