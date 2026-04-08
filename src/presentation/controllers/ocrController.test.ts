import { describe, it, expect, beforeEach, vi } from "vitest";
import { mock, type MockProxy } from "vitest-mock-extended";
import { OcrController } from "./ocrController";
import type { ExtractKtpDataUseCase } from "../../application/usecases/ocr/ExtractKtpDataUseCase";
import { StatusCodes } from "http-status-codes";
import type { Request, Response } from "express";

vi.mock("../../utils/response", () => ({
  sendResponse: vi.fn(),
}));
import { sendResponse } from "../../utils/response";

describe("OcrController", () => {
  let extractKtpDataUseCaseMock: MockProxy<ExtractKtpDataUseCase>;
  let controller: OcrController;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    extractKtpDataUseCaseMock = mock<ExtractKtpDataUseCase>();
    controller = new OcrController(extractKtpDataUseCaseMock);

    req = { body: {}, file: undefined };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    vi.clearAllMocks();
  });

  it("harus memanggil usecase dan mereturn 200 OK jika file KTP valid", async () => {
    const mockBuffer = Buffer.from("dummy-buffer");

    req.file = { buffer: mockBuffer } as any;

    const mockResult = {
      nik: "3201234567890123",
      nama: "Budi Santoso",
      alamat: "Jl. Merdeka",
      statusPerkawinan: "BELUM KAWIN",
    };

    extractKtpDataUseCaseMock.execute.mockResolvedValue(mockResult);

    await controller.extractKtpData(req as any, res as any);

    expect(extractKtpDataUseCaseMock.execute).toHaveBeenCalledWith(mockBuffer);
    expect(sendResponse).toHaveBeenCalledWith(
      res,
      StatusCodes.OK,
      "Berhasil mengekstrak data KTP",
      mockResult,
    );
  });

  it("harus mereturn 400 BAD_REQUEST jika file foto KTP (req.file) tidak ada", async () => {
    req.file = undefined;

    await controller.extractKtpData(req as any, res as any);

    expect(sendResponse).toHaveBeenCalledWith(
      res,
      StatusCodes.BAD_REQUEST,
      "File foto KTP (foto_ktp) wajib diunggah.",
    );

    expect(extractKtpDataUseCaseMock.execute).not.toHaveBeenCalled();
  });
});
