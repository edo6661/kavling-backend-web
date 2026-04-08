import { describe, it, expect, beforeEach, vi } from "vitest";
import { mock, type MockProxy } from "vitest-mock-extended";
import { SprController } from "./SprController.1";
import type { CreateSprUseCase } from "../../application/usecases/spr/CreateSprUseCase";
import type { UpdateSprUseCase } from "../../application/usecases/spr/UpdateSprUseCase";
import type { GetSprByIdUseCase } from "../../application/usecases/spr/GetSprByIdUseCase";
import type { GetSprsPaginatedUseCase } from "../../application/usecases/spr/GetSprsPaginatedUseCase";
import type { DeleteSprUseCase } from "../../application/usecases/spr/DeleteSprUseCase";
import { StatusCodes } from "http-status-codes";
import type { Request, Response } from "express";

vi.mock("../../utils/response", () => ({
  sendResponse: vi.fn(),
}));
import { sendResponse } from "../../utils/response";

describe("SprController", () => {
  let createUseCaseMock: MockProxy<CreateSprUseCase>;
  let updateUseCaseMock: MockProxy<UpdateSprUseCase>;
  let getByIdUseCaseMock: MockProxy<GetSprByIdUseCase>;
  let getPaginatedUseCaseMock: MockProxy<GetSprsPaginatedUseCase>;
  let deleteUseCaseMock: MockProxy<DeleteSprUseCase>;

  let controller: SprController;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    createUseCaseMock = mock<CreateSprUseCase>();
    updateUseCaseMock = mock<UpdateSprUseCase>();
    getByIdUseCaseMock = mock<GetSprByIdUseCase>();
    getPaginatedUseCaseMock = mock<GetSprsPaginatedUseCase>();
    deleteUseCaseMock = mock<DeleteSprUseCase>();

    controller = new SprController(
      createUseCaseMock,
      updateUseCaseMock,
      getByIdUseCaseMock,
      getPaginatedUseCaseMock,
      deleteUseCaseMock,
    );

    req = { params: {}, body: {}, query: {}, user: { userId: 3 } as any };
    res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    vi.clearAllMocks();
  });

  it("create - harus memanggil usecase dengan marketingId dari user payload jika tidak dikirim, dan return 201", async () => {
    req.body = { customerId: 1, unitId: 2, hargaJual: 100 };

    const mockResult: any = { id: 1, ...req.body, marketingUserId: 3 };
    createUseCaseMock.execute.mockResolvedValue(mockResult);

    await controller.create(req as any, res as Response);

    expect(createUseCaseMock.execute).toHaveBeenCalledWith({
      ...req.body,
      marketingUserId: 3,
    });
    expect(sendResponse).toHaveBeenCalledWith(
      res,
      StatusCodes.CREATED,
      "SPR berhasil dibuat",
      mockResult,
    );
  });
});
