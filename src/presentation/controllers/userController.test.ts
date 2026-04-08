import { describe, it, expect, beforeEach, vi } from "vitest";
import { mock, type MockProxy } from "vitest-mock-extended";
import { UserController } from "./userController";
import type { GetAllUsersUseCase } from "../../application/usecases/user/GetAllUsersUseCase";
import type { UpdateUserUseCase } from "../../application/usecases/user/UpdateUserUseCase";
import type { GetUsersPaginatedUseCase } from "../../application/usecases/user/GetUsersPaginatedUseCase";
import { StatusCodes } from "http-status-codes";
import type { Request, Response } from "express";

vi.mock("../../utils/response", () => ({
  sendResponse: vi.fn(),
}));
import { sendResponse } from "../../utils/response";

describe("UserController", () => {
  let getAllUsersUseCase: MockProxy<GetAllUsersUseCase>;
  let updateUserUseCase: MockProxy<UpdateUserUseCase>;
  let getUsersPaginatedUseCase: MockProxy<GetUsersPaginatedUseCase>;
  let controller: UserController;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    getAllUsersUseCase = mock<GetAllUsersUseCase>();
    updateUserUseCase = mock<UpdateUserUseCase>();
    getUsersPaginatedUseCase = mock<GetUsersPaginatedUseCase>();
    controller = new UserController(
      getAllUsersUseCase,
      updateUserUseCase,
      getUsersPaginatedUseCase,
    );

    req = {};
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    vi.clearAllMocks();
  });

  it("getAll - harus memanggil usecase dan return 200", async () => {
    getAllUsersUseCase.execute.mockResolvedValue([]);

    await controller.getAll(req as Request, res as Response);

    expect(getAllUsersUseCase.execute).toHaveBeenCalled();
    expect(sendResponse).toHaveBeenCalledWith(
      res,
      StatusCodes.OK,
      expect.any(String),
      [],
    );
  });

  it("update - harus meneruskan ID dari params dan Body ke usecase", async () => {
    req.params = { id: "1" };
    req.body = { username: "Updated Name" };

    const mockResult: any = { id: 1, username: "Updated Name" };
    updateUserUseCase.execute.mockResolvedValue(mockResult);

    await controller.update(req as any, res as Response);

    expect(updateUserUseCase.execute).toHaveBeenCalledWith(1, req.body);
    expect(sendResponse).toHaveBeenCalledWith(
      res,
      StatusCodes.OK,
      expect.any(String),
      mockResult,
    );
  });
});
