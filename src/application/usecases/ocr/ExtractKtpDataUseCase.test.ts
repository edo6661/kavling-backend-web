import { describe, it, expect, beforeEach, vi } from "vitest";
import { mock, type MockProxy } from "vitest-mock-extended";
import { ExtractKtpDataUseCase } from "./ExtractKtpDataUseCase";
import type { GoogleVisionService } from "../../../infrastructure/external/GoogleVisionService";
import { AppError } from "../../../domain/errors/AppError";
import { StatusCodes } from "http-status-codes";

describe("ExtractKtpDataUseCase", () => {
  let googleVisionServiceMock: MockProxy<GoogleVisionService>;
  let useCase: ExtractKtpDataUseCase;

  beforeEach(() => {
    googleVisionServiceMock = mock<GoogleVisionService>();
    useCase = new ExtractKtpDataUseCase(googleVisionServiceMock);
    vi.clearAllMocks();
  });

  it("harus berhasil mengekstrak data dari buffer KTP dengan memanggil GoogleVisionService", async () => {
    const mockBuffer = Buffer.from("dummy image data");
    const mockExtractedData = {
      nik: "3201234567890123",
      nama: "Budi Santoso",
      alamat: "Jl. Merdeka No. 1",
      statusPerkawinan: "BELUM KAWIN",
    };

    googleVisionServiceMock.extractKtpData.mockResolvedValue(mockExtractedData);

    const result = await useCase.execute(mockBuffer);

    expect(googleVisionServiceMock.extractKtpData).toHaveBeenCalledWith(
      mockBuffer,
    );
    expect(result).toEqual(mockExtractedData);
  });

  it("harus melempar AppError BAD_REQUEST jika buffer KTP kosong", async () => {
    await expect(useCase.execute(null as any)).rejects.toThrow(AppError);

    try {
      await useCase.execute(null as any);
    } catch (error: any) {
      expect(error.statusCode).toBe(StatusCodes.BAD_REQUEST);
      expect(error.message).toBe("Buffer foto KTP tidak boleh kosong.");
    }

    expect(googleVisionServiceMock.extractKtpData).not.toHaveBeenCalled();
  });
});
