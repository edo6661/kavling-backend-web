import { describe, it, expect, beforeEach, vi } from "vitest";
import { mock, type MockProxy } from "vitest-mock-extended";
import { BankRekeningPtController } from "./bankRekeningPtController";
import type {
  CreateBankRekeningPtUseCase,
  UpdateBankRekeningPtUseCase,
  GetBankRekeningPtByIdUseCase,
  GetBankRekeningPtPaginatedUseCase,
  DeleteBankRekeningPtUseCase,
} from "../../application/usecases/bankRekeningPt/BankRekeningPtUseCases";
import { StatusCodes } from "http-status-codes";
import type { Request, Response } from "express";

vi.mock("../../utils/response", () => ({
  sendResponse: vi.fn(),
}));
import { sendResponse } from "../../utils/response";

describe("BankRekeningPtController", () => {
  let createUseCaseMock: MockProxy<CreateBankRekeningPtUseCase>;
  let updateUseCaseMock: MockProxy<UpdateBankRekeningPtUseCase>;
  let getByIdUseCaseMock: MockProxy<GetBankRekeningPtByIdUseCase>;
  let getPaginatedUseCaseMock: MockProxy<GetBankRekeningPtPaginatedUseCase>;
  let deleteUseCaseMock: MockProxy<DeleteBankRekeningPtUseCase>;

  let controller: BankRekeningPtController;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    createUseCaseMock = mock<CreateBankRekeningPtUseCase>();
    updateUseCaseMock = mock<UpdateBankRekeningPtUseCase>();
    getByIdUseCaseMock = mock<GetBankRekeningPtByIdUseCase>();
    getPaginatedUseCaseMock = mock<GetBankRekeningPtPaginatedUseCase>();
    deleteUseCaseMock = mock<DeleteBankRekeningPtUseCase>();

    controller = new BankRekeningPtController(
      createUseCaseMock,
      updateUseCaseMock,
      getByIdUseCaseMock,
      getPaginatedUseCaseMock,
      deleteUseCaseMock,
    );

    req = { params: {}, body: {}, query: {} };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    vi.clearAllMocks();
  });

  it("create - harus memanggil usecase dan return 201", async () => {
    const mockBody = {
      namaBank: "BCA",
      noRekening: "123456",
      atasNama: "PT ABC",
    };
    req.body = mockBody;

    const mockResult: any = { id: 1, ...mockBody };
    createUseCaseMock.execute.mockResolvedValue(mockResult);

    await controller.create(req as any, res as Response);

    expect(createUseCaseMock.execute).toHaveBeenCalledWith(mockBody);
    expect(sendResponse).toHaveBeenCalledWith(
      res,
      StatusCodes.CREATED,
      "Rekening berhasil ditambahkan",
      mockResult,
    );
  });

  it("update - harus meneruskan ID dan Body ke usecase dan return 200", async () => {
    req.params = { id: "1" };
    req.body = { namaBank: "Mandiri" };

    const mockResult: any = { id: 1, namaBank: "Mandiri" };
    updateUseCaseMock.execute.mockResolvedValue(mockResult);

    await controller.update(req as any, res as Response);

    expect(updateUseCaseMock.execute).toHaveBeenCalledWith(1, req.body);
    expect(sendResponse).toHaveBeenCalledWith(
      res,
      StatusCodes.OK,
      "Rekening berhasil diperbarui",
      mockResult,
    );
  });

  it("getById - harus memanggil usecase dengan ID dan return 200", async () => {
    req.params = { id: "1" };

    const mockResult: any = { id: 1, namaBank: "BCA" };
    getByIdUseCaseMock.execute.mockResolvedValue(mockResult);

    await controller.getById(req as any, res as Response);

    expect(getByIdUseCaseMock.execute).toHaveBeenCalledWith(1);
    expect(sendResponse).toHaveBeenCalledWith(
      res,
      StatusCodes.OK,
      "Data rekening berhasil diambil",
      mockResult,
    );
  });

  it("getPaginated - harus memparsing query dan memanggil usecase, lalu return 200", async () => {
    req.query = { limit: "10", search: "BCA" };

    const mockResult: any = {
      items: [],
      meta: { nextCursor: null, hasNextPage: false },
    };
    getPaginatedUseCaseMock.execute.mockResolvedValue(mockResult);

    await controller.getPaginated(req as Request, res as Response);

    expect(getPaginatedUseCaseMock.execute).toHaveBeenCalledWith(
      10,
      undefined,
      { search: "BCA" },
    );
    expect(sendResponse).toHaveBeenCalledWith(
      res,
      StatusCodes.OK,
      "Daftar rekening berhasil diambil",
      mockResult,
    );
  });

  it("delete - harus memanggil usecase dengan ID dan return 200", async () => {
    req.params = { id: "1" };
    deleteUseCaseMock.execute.mockResolvedValue();

    await controller.delete(req as any, res as Response);

    expect(deleteUseCaseMock.execute).toHaveBeenCalledWith(1);
    expect(sendResponse).toHaveBeenCalledWith(
      res,
      StatusCodes.OK,
      "Rekening berhasil dihapus",
    );
  });
});
