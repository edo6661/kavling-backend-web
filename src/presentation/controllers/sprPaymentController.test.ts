import { describe, it, expect, beforeEach, vi } from "vitest";
import { mock, type MockProxy } from "vitest-mock-extended";
import { SprPaymentController } from "./sprPaymentController";
import type {
  CreateSprPaymentUseCase,
  UpdateSprPaymentUseCase,
  GetSprPaymentByIdUseCase,
  GetSprPaymentsPaginatedUseCase,
  DeleteSprPaymentUseCase,
  UploadBuktiTransferUseCase,
} from "../../application/usecases/sprPayment/SprPaymentUseCases";
import { StatusCodes } from "http-status-codes";
import type { Request, Response } from "express";

vi.mock("../../utils/response", () => ({
  sendResponse: vi.fn(),
}));
import { sendResponse } from "../../utils/response";

describe("SprPaymentController", () => {
  let createUseCaseMock: MockProxy<CreateSprPaymentUseCase>;
  let updateUseCaseMock: MockProxy<UpdateSprPaymentUseCase>;
  let getByIdUseCaseMock: MockProxy<GetSprPaymentByIdUseCase>;
  let getPaginatedUseCaseMock: MockProxy<GetSprPaymentsPaginatedUseCase>;
  let deleteUseCaseMock: MockProxy<DeleteSprPaymentUseCase>;
  let uploadBuktiUseCaseMock: MockProxy<UploadBuktiTransferUseCase>;

  let controller: SprPaymentController;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    createUseCaseMock = mock<CreateSprPaymentUseCase>();
    updateUseCaseMock = mock<UpdateSprPaymentUseCase>();
    getByIdUseCaseMock = mock<GetSprPaymentByIdUseCase>();
    getPaginatedUseCaseMock = mock<GetSprPaymentsPaginatedUseCase>();
    deleteUseCaseMock = mock<DeleteSprPaymentUseCase>();
    uploadBuktiUseCaseMock = mock<UploadBuktiTransferUseCase>();

    controller = new SprPaymentController(
      createUseCaseMock,
      updateUseCaseMock,
      getByIdUseCaseMock,
      getPaginatedUseCaseMock,
      deleteUseCaseMock,
      uploadBuktiUseCaseMock,
    );

    req = { params: {}, body: {}, query: {}, file: undefined };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    vi.clearAllMocks();
  });

  it("create - harus memanggil usecase dan return 201 CREATED", async () => {
    req.body = { sprId: 1, keterangan: "DP 1", nilai: 5000000 };
    const mockResult: any = { id: 1, ...req.body };
    createUseCaseMock.execute.mockResolvedValue(mockResult);

    await controller.create(req as any, res as Response);

    expect(createUseCaseMock.execute).toHaveBeenCalledWith(req.body);
    expect(sendResponse).toHaveBeenCalledWith(
      res,
      StatusCodes.CREATED,
      "Jadwal pembayaran berhasil dibuat",
      mockResult,
    );
  });

  it("update - harus meneruskan ID dan Body ke usecase dan return 200 OK", async () => {
    req.params = { id: "1" };
    req.body = { keterangan: "Update DP 1" };
    const mockResult: any = { id: 1, keterangan: "Update DP 1" };
    updateUseCaseMock.execute.mockResolvedValue(mockResult);

    await controller.update(req as any, res as Response);

    expect(updateUseCaseMock.execute).toHaveBeenCalledWith(1, req.body);
    expect(sendResponse).toHaveBeenCalledWith(
      res,
      StatusCodes.OK,
      "Data pembayaran berhasil diperbarui",
      mockResult,
    );
  });

  it("getPaginated - harus memparsing query dan memanggil usecase dengan parameter paginasi", async () => {
    req.query = { limit: "10", sprId: "1" };
    const mockResult: any = { items: [], meta: {} };
    getPaginatedUseCaseMock.execute.mockResolvedValue(mockResult);

    await controller.getPaginated(req as Request, res as Response);

    expect(getPaginatedUseCaseMock.execute).toHaveBeenCalledWith(
      10,
      undefined,
      { sprId: 1 },
    );
    expect(sendResponse).toHaveBeenCalledWith(
      res,
      StatusCodes.OK,
      "Daftar pembayaran berhasil diambil",
      mockResult,
    );
  });

  describe("uploadBukti", () => {
    it("harus mereturn 400 BAD_REQUEST jika file bukti_transfer tidak diunggah", async () => {
      req.params = { id: "1" };
      req.file = undefined;

      await controller.uploadBukti(req as any, res as Response);

      expect(sendResponse).toHaveBeenCalledWith(
        res,
        StatusCodes.BAD_REQUEST,
        "File bukti_transfer wajib diunggah",
      );
      expect(uploadBuktiUseCaseMock.execute).not.toHaveBeenCalled();
    });

    it("harus memanggil usecase dan mereturn 200 OK jika upload sukses", async () => {
      req.params = { id: "1" };
      const buffer = Buffer.from("image");
      req.file = { buffer } as any;

      const mockResult: any = {
        id: 1,
        buktiTransfer: "https://url.com/img.jpg",
      };
      uploadBuktiUseCaseMock.execute.mockResolvedValue(mockResult);

      await controller.uploadBukti(req as any, res as Response);

      expect(uploadBuktiUseCaseMock.execute).toHaveBeenCalledWith(1, buffer);
      expect(sendResponse).toHaveBeenCalledWith(
        res,
        StatusCodes.OK,
        "Bukti transfer berhasil diunggah",
        mockResult,
      );
    });
  });
});
