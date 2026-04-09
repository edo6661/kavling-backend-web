import type { GoogleVisionService } from "../../../infrastructure/external/GoogleVisionService.js";
import { AppError } from "../../../domain/errors/AppError.js";
import { StatusCodes } from "http-status-codes";

export class ExtractKtpDataUseCase {
  constructor(private readonly googleVisionService: GoogleVisionService) {}

  async execute(fotoKtpBuffer: Buffer): Promise<{
    nik: string | null;
    nama: string | null;
    alamat: string | null;
  }> {
    if (!fotoKtpBuffer) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "Buffer foto KTP tidak boleh kosong.",
      );
    }

    return this.googleVisionService.extractKtpData(fotoKtpBuffer);
  }
}
