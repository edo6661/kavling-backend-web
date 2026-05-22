import { describe, it, expect, beforeEach, vi } from "vitest";
import { mock, type MockProxy } from "vitest-mock-extended";
import { CustomerController } from "./customerController";
import type { CreateCustomerUseCase } from "../../application/usecases/customer/CreateCustomerUseCase";
import type { UpdateCustomerUseCase } from "../../application/usecases/customer/UpdateCustomerUseCase";
import type { GetCustomerByIdUseCase } from "../../application/usecases/customer/GetCustomerByIdUseCase";
import type { GetCustomersPaginatedUseCase } from "../../application/usecases/customer/GetCustomersPaginatedUseCase";
import type { DeleteCustomerUseCase } from "../../application/usecases/customer/DeleteCustomerUseCase";
import { StatusCodes } from "http-status-codes";
import type { Request, Response } from "express";

// Mock utility sendResponse agar kita bisa cek argumennya
vi.mock("../../utils/response", () => ({
  sendResponse: vi.fn(),
}));
import { sendResponse } from "../../utils/response";

describe("CustomerController", () => {
  let createUseCaseMock: MockProxy<CreateCustomerUseCase>;
  let updateUseCaseMock: MockProxy<UpdateCustomerUseCase>;
  let getByIdUseCaseMock: MockProxy<GetCustomerByIdUseCase>;
  let getPaginatedUseCaseMock: MockProxy<GetCustomersPaginatedUseCase>;
  let deleteUseCaseMock: MockProxy<DeleteCustomerUseCase>;

  let controller: CustomerController;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    createUseCaseMock = mock<CreateCustomerUseCase>();
    updateUseCaseMock = mock<UpdateCustomerUseCase>();
    getByIdUseCaseMock = mock<GetCustomerByIdUseCase>();
    getPaginatedUseCaseMock = mock<GetCustomersPaginatedUseCase>();
    deleteUseCaseMock = mock<DeleteCustomerUseCase>();

    controller = new CustomerController(
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

  it("create - harus memanggil usecase dan return status 201 CREATED", async () => {
    const mockBody = {
      nikKtp: "3201234567890123",
      nama: "Budi Santoso",
      noHp: "081234567890",
      alamatKtp: "Jl. Merdeka No. 1",
    };
    req.body = mockBody;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockResult: any = { id: 1, ...mockBody };
    createUseCaseMock.execute.mockResolvedValue(mockResult);

    // Cast req karena menggunakan TypedRequest di controller
    await controller.create(req as any, res as Response);

    expect(createUseCaseMock.execute).toHaveBeenCalledWith(mockBody);
    expect(sendResponse).toHaveBeenCalledWith(
      res,
      StatusCodes.CREATED,
      "Customer berhasil ditambahkan",
      mockResult,
    );
  });

  it("update - harus meneruskan ID dan Body ke usecase dan return status 200 OK", async () => {
    req.params = { id: "1" };
    req.body = { nama: "Budi Updated" };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockResult: any = { id: 1, nama: "Budi Updated" };
    updateUseCaseMock.execute.mockResolvedValue(mockResult);

    await controller.update(req as any, res as Response);

    expect(updateUseCaseMock.execute).toHaveBeenCalledWith(1, req.body);
    expect(sendResponse).toHaveBeenCalledWith(
      res,
      StatusCodes.OK,
      "Customer berhasil diperbarui",
      mockResult,
    );
  });

  it("getById - harus memanggil usecase dengan ID dan return status 200 OK", async () => {
    req.params = { id: "1" };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockResult: any = { id: 1, nama: "Budi Santoso" };
    getByIdUseCaseMock.execute.mockResolvedValue(mockResult);

    await controller.getById(req as any, res as Response);

    expect(getByIdUseCaseMock.execute).toHaveBeenCalledWith(1);
    expect(sendResponse).toHaveBeenCalledWith(
      res,
      StatusCodes.OK,
      "Data customer berhasil diambil",
      mockResult,
    );
  });

  it("getPaginated - harus memparsing query dan memanggil usecase, lalu return 200 OK", async () => {
    // Controller melakukan parsing menggunakan Zod, jadi berikan data yang valid
    req.query = { page: "1", limit: "10", search: "Budi" };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockResult: any = {
      items: [{ id: 1, nama: "Budi Santoso" }],
      meta: {
        page: 1,
        limit: 10,
        totalItems: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };
    getPaginatedUseCaseMock.execute.mockResolvedValue(mockResult);

    await controller.getPaginated(req as Request, res as Response);

    expect(getPaginatedUseCaseMock.execute).toHaveBeenCalledWith(1, 10, {
      search: "Budi",
    });
    expect(sendResponse).toHaveBeenCalledWith(
      res,
      StatusCodes.OK,
      "Daftar customer berhasil diambil",
      mockResult,
    );
  });

  it("delete - harus memanggil usecase dengan ID dan return 200 OK", async () => {
    req.params = { id: "1" };
    deleteUseCaseMock.execute.mockResolvedValue();

    await controller.delete(req as any, res as Response);

    expect(deleteUseCaseMock.execute).toHaveBeenCalledWith(1);
    expect(sendResponse).toHaveBeenCalledWith(
      res,
      StatusCodes.OK,
      "Customer berhasil dihapus",
    );
  });
});
