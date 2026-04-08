import { describe, it, expect, beforeEach, vi } from "vitest";
import { mock, type MockProxy } from "vitest-mock-extended";
import { UnitController } from "./unitController";
import type { CreateUnitUseCase } from "../../application/usecases/unit/CreateUnitUseCase";
import type { UpdateUnitUseCase } from "../../application/usecases/unit/UpdateUnitUseCase";
import type { GetUnitByIdUseCase } from "../../application/usecases/unit/GetUnitByIdUseCase";
import type { GetUnitsPaginatedUseCase } from "../../application/usecases/unit/GetUnitsPaginatedUseCase";
import type { DeleteUnitUseCase } from "../../application/usecases/unit/DeleteUnitUseCase";
import { StatusCodes } from "http-status-codes";
import type { Request, Response } from "express";
import { UnitStatus } from "@prisma/client";

vi.mock("../../utils/response", () => ({
  sendResponse: vi.fn(),
}));
import { sendResponse } from "../../utils/response";

describe("UnitController", () => {
  let createUnitUseCase: MockProxy<CreateUnitUseCase>;
  let updateUnitUseCase: MockProxy<UpdateUnitUseCase>;
  let getUnitByIdUseCase: MockProxy<GetUnitByIdUseCase>;
  let getUnitsPaginatedUseCase: MockProxy<GetUnitsPaginatedUseCase>;
  let deleteUnitUseCase: MockProxy<DeleteUnitUseCase>;

  let controller: UnitController;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    createUnitUseCase = mock<CreateUnitUseCase>();
    updateUnitUseCase = mock<UpdateUnitUseCase>();
    getUnitByIdUseCase = mock<GetUnitByIdUseCase>();
    getUnitsPaginatedUseCase = mock<GetUnitsPaginatedUseCase>();
    deleteUnitUseCase = mock<DeleteUnitUseCase>();

    controller = new UnitController(
      createUnitUseCase,
      updateUnitUseCase,
      getUnitByIdUseCase,
      getUnitsPaginatedUseCase,
      deleteUnitUseCase,
    );

    req = { params: {}, body: {}, query: {} };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    vi.clearAllMocks();
  });

  it("create - harus memanggil usecase dan return 201", async () => {
    const mockBody = { namaPerumahan: "Bumantara", blokUnit: "A1" };
    req.body = mockBody;

    const mockResult: any = { id: 1, ...mockBody };
    createUnitUseCase.execute.mockResolvedValue(mockResult);

    await controller.create(req as any, res as Response);

    expect(createUnitUseCase.execute).toHaveBeenCalledWith(mockBody);
    expect(sendResponse).toHaveBeenCalledWith(
      res,
      StatusCodes.CREATED,
      "Unit berhasil ditambahkan",
      mockResult,
    );
  });

  it("update - harus meneruskan ID dan Body ke usecase dan return 200", async () => {
    req.params = { id: "1" };
    req.body = { status: UnitStatus.TERJUAL };

    const mockResult: any = { id: 1, status: UnitStatus.TERJUAL };
    updateUnitUseCase.execute.mockResolvedValue(mockResult);

    await controller.update(req as any, res as Response);

    expect(updateUnitUseCase.execute).toHaveBeenCalledWith(1, req.body);
    expect(sendResponse).toHaveBeenCalledWith(
      res,
      StatusCodes.OK,
      "Unit berhasil diperbarui",
      mockResult,
    );
  });

  it("getById - harus memanggil usecase dengan ID dan return 200", async () => {
    req.params = { id: "1" };

    const mockResult: any = { id: 1, namaPerumahan: "Bumantara" };
    getUnitByIdUseCase.execute.mockResolvedValue(mockResult);

    await controller.getById(req as any, res as Response);

    expect(getUnitByIdUseCase.execute).toHaveBeenCalledWith(1);
    expect(sendResponse).toHaveBeenCalledWith(
      res,
      StatusCodes.OK,
      "Data unit berhasil diambil",
      mockResult,
    );
  });

  it("delete - harus memanggil usecase dengan ID dan return 200", async () => {
    req.params = { id: "1" };
    deleteUnitUseCase.execute.mockResolvedValue();

    await controller.delete(req as any, res as Response);

    expect(deleteUnitUseCase.execute).toHaveBeenCalledWith(1);
    expect(sendResponse).toHaveBeenCalledWith(
      res,
      StatusCodes.OK,
      "Unit berhasil dihapus",
    );
  });
});
