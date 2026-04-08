import { describe, it, expect, vi, beforeEach } from "vitest";
import { mock, type MockProxy } from "vitest-mock-extended";
import { AuthController } from "./authController";
import type { RegisterUserUseCase } from "../../application/usecases/auth/RegisterUserUseCase";
import type { LoginUserUseCase } from "../../application/usecases/auth/LoginUserUseCase";
import type { GetProfileUseCase } from "../../application/usecases/auth/GetProfileUseCase";
import { StatusCodes } from "http-status-codes";
import type { Request, Response } from "express";
import { Role } from "@prisma/client";

vi.mock("../../utils/response", () => ({
  sendResponse: vi.fn(),
}));
import { sendResponse } from "../../utils/response";

describe("AuthController", () => {
  let registerUseCaseMock: MockProxy<RegisterUserUseCase>;
  let loginUseCaseMock: MockProxy<LoginUserUseCase>;
  let getProfileUseCaseMock: MockProxy<GetProfileUseCase>;
  let authController: AuthController;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    registerUseCaseMock = mock<RegisterUserUseCase>();
    loginUseCaseMock = mock<LoginUserUseCase>();
    getProfileUseCaseMock = mock<GetProfileUseCase>();

    authController = new AuthController(
      registerUseCaseMock,
      loginUseCaseMock,
      getProfileUseCaseMock,
    );

    mockReq = { body: {} };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    vi.clearAllMocks();
  });

  describe("register", () => {
    it("harus memanggil usecase register dan return 201", async () => {
      const result = {
        id: 1,
        username: "Test",
        email: "test@example.com",
        role: Role.CUSTOMER,
        createdAt: new Date(),
      };
      registerUseCaseMock.execute.mockResolvedValue(result);

      mockReq.body = {
        username: "Test",
        email: "test@example.com",
        password: "pw",
        role: Role.CUSTOMER,
      };
      await authController.register(mockReq as Request, mockRes as Response);

      expect(registerUseCaseMock.execute).toHaveBeenCalledWith(mockReq.body);
      expect(sendResponse).toHaveBeenCalledWith(
        mockRes,
        StatusCodes.CREATED,
        "User registered successfully",
        result,
      );
    });
  });

  describe("login", () => {
    it("harus memanggil usecase login dan return 200", async () => {
      const result = {
        token: "token_abc",
        user: {
          id: 1,
          username: "User",
          email: "u@u.com",
          role: Role.CUSTOMER,
        },
      };
      loginUseCaseMock.execute.mockResolvedValue(result);

      mockReq.body = { email: "u@u.com", password: "pw" };
      await authController.login(mockReq as Request, mockRes as Response);

      expect(loginUseCaseMock.execute).toHaveBeenCalledWith(mockReq.body);
      expect(sendResponse).toHaveBeenCalledWith(
        mockRes,
        StatusCodes.OK,
        "Login Sukses",
        result,
      );
    });
  });

  describe("getProfile", () => {
    it("harus mereturn data user dari usecase (200 OK)", async () => {
      const mockUserPayload = {
        userId: 1,
        username: "Test User",
        email: "test@example.com",
        role: Role.CUSTOMER,
      };

      const mockUsecaseResult = {
        id: 1,
        username: "Test User",
        email: "test@example.com",
        role: Role.CUSTOMER,
        createdAt: new Date(),
      };

      mockReq.user = mockUserPayload;
      getProfileUseCaseMock.execute.mockResolvedValue(mockUsecaseResult);

      await authController.getProfile(mockReq as Request, mockRes as Response);

      expect(getProfileUseCaseMock.execute).toHaveBeenCalledWith(
        mockUserPayload.userId,
      );
      expect(sendResponse).toHaveBeenCalledWith(
        mockRes,
        StatusCodes.OK,
        "Berhasil mengambil profil",
        { user: mockUsecaseResult },
      );
    });
  });
});
