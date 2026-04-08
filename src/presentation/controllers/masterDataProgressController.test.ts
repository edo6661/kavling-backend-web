import { describe, it, expect, beforeEach, vi } from "vitest";
import { mock, type MockProxy } from "vitest-mock-extended";
import { MasterDataProgressController } from "./masterDataProgressController";
import type {
  CreateMasterDataProgressUseCase,
  UpdateMasterDataProgressUseCase,
  GetMasterDataProgressByIdUseCase,
  GetMasterDataProgressBySprIdUseCase,
  GetMasterDataProgressPaginatedUseCase,
} from "../../application/usecases/masterDataProgress/MasterDataProgressUseCases";
import { StatusCodes } from "http-status-codes";
import type { Request, Response } from "express";

vi.mock("../../utils/response", () => ({
  sendResponse: vi.fn(),
}));
import { sendResponse } from "../../utils/response";

describe("MasterDataProgressController", () => {
  let createUseCaseMock: MockProxy<CreateMasterDataProgressUseCase>;
  let updateUseCaseMock: MockProxy<UpdateMasterDataProgressUseCase>;
  let getByIdUseCaseMock: MockProxy<GetMasterDataProgressByIdUseCase>;
  let getBySprIdUseCaseMock: MockProxy<GetMasterDataProgressBySprIdUseCase>;
  let getPaginatedUseCaseMock: MockProxy<GetMasterDataProgressPaginatedUseCase>;

  let controller: MasterDataProgressController;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    createUseCaseMock = mock<CreateMasterDataProgressUseCase>();
    updateUseCaseMock = mock<UpdateMasterDataProgressUseCase>();
    getByIdUseCaseMock = mock<GetMasterDataProgressByIdUseCase>();
    getBySprIdUseCaseMock = mock<GetMasterDataProgressBySprIdUseCase>();
    getPaginatedUseCaseMock = mock<GetMasterDataProgressPaginatedUseCase>();

    controller = new MasterDataProgressController(
      createUseCaseMock,
      updateUseCaseMock,
      getByIdUseCaseMock,
      getBySprIdUseCaseMock,
      getPaginatedUseCaseMock,
    );

    req = { params: {}, body: {}, query: {} };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    vi.clearAllMocks();
  });

  it("create - harus memanggil usecase dan return 201", async () => {
    req.body = { sprId: 10 };
    const mockResult: any = { id: 1, sprId: 10 };
    createUseCaseMock.execute.mockResolvedValue(mockResult);

    await controller.create(req as any, res as Response);

    expect(createUseCaseMock.execute).toHaveBeenCalledWith(req.body);
    expect(sendResponse).toHaveBeenCalledWith(
      res,
      StatusCodes.CREATED,
      "Master Data Progress berhasil diinisiasi",
      mockResult,
    );
  });

  describe("getBySprId", () => {
    it("harus mereturn 400 BAD_REQUEST jika sprId bukan angka", async () => {
      req.params = { sprId: "abc" };

      await controller.getBySprId(req as Request, res as Response);

      expect(sendResponse).toHaveBeenCalledWith(
        res,
        StatusCodes.BAD_REQUEST,
        "Parameter sprId harus berupa angka",
      );
      expect(getBySprIdUseCaseMock.execute).not.toHaveBeenCalled();
    });

    it("harus memanggil usecase dan mereturn 200 OK jika sprId valid", async () => {
      req.params = { sprId: "10" };
      const mockResult: any = { id: 1, sprId: 10 };
      getBySprIdUseCaseMock.execute.mockResolvedValue(mockResult);

      await controller.getBySprId(req as Request, res as Response);

      expect(getBySprIdUseCaseMock.execute).toHaveBeenCalledWith(10);
      expect(sendResponse).toHaveBeenCalledWith(
        res,
        StatusCodes.OK,
        "Data progress untuk SPR tersebut berhasil diambil",
        mockResult,
      );
    });
  });

  it("update - harus memanggil usecase dengan ID integer", async () => {
    req.params = { id: "5" };
    req.body = { statusAkadPpjb: "Selesai" };
    const mockResult: any = { id: 5, statusAkadPpjb: "Selesai" };
    updateUseCaseMock.execute.mockResolvedValue(mockResult);

    await controller.update(req as any, res as Response);

    expect(updateUseCaseMock.execute).toHaveBeenCalledWith(5, req.body);
    expect(sendResponse).toHaveBeenCalledWith(
      res,
      StatusCodes.OK,
      "Master Data Progress berhasil diperbarui",
      mockResult,
    );
  });
});
