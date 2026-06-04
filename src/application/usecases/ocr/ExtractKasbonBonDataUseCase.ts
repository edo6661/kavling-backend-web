import type { GoogleVisionService } from "../../../infrastructure/external/GoogleVisionService.js";
import type { KasbonBonExtractResult } from "../../../infrastructure/external/GoogleVisionService.js";
import { AppError } from "../../../domain/errors/AppError.js";
import { StatusCodes } from "http-status-codes";

export class ExtractKasbonBonDataUseCase {
  constructor(private readonly googleVisionService: GoogleVisionService) {}

  async execute(
    imageBuffer: Buffer,
    mimeType: string,
  ): Promise<KasbonBonExtractResult> {
    if (!imageBuffer?.length) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "Buffer foto bon tidak boleh kosong.",
      );
    }

    return this.googleVisionService.extractKasbonBonData(
      imageBuffer,
      mimeType,
    );
  }
}
