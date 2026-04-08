import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { authenticate, requireRole } from "./authMiddleware";
import jwt from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import { Role } from "@prisma/client";

// Mock sendResponse
vi.mock("../utils/response", () => ({
  sendResponse: vi.fn(),
}));
import { sendResponse } from "../utils/response";

describe("Auth Middleware", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    mockReq = { headers: {} };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    next = vi.fn();
    vi.clearAllMocks();
  });

  describe("authenticate", () => {
    it("harus menolak request tanpa header Authorization", () => {
      authenticate(mockReq as Request, mockRes as Response, next);
      expect(sendResponse).toHaveBeenCalledWith(
        mockRes,
        StatusCodes.UNAUTHORIZED,
        expect.stringContaining("Access denied"),
      );
    });

    it("harus memanggil next() dan set user jika token valid", () => {
      mockReq.headers = { authorization: "Bearer valid_token" };

      const decodedToken = {
        userId: 1,
        username: "Test User",
        email: "test@example.com",
        role: Role.CUSTOMER,
      };

      vi.spyOn(jwt, "verify").mockReturnValue(decodedToken as any);

      authenticate(mockReq as Request, mockRes as Response, next);

      expect(jwt.verify).toHaveBeenCalled();
      expect(mockReq.user).toEqual(decodedToken);
      expect(next).toHaveBeenCalled();
    });

    it("harus menolak request jika token expired/invalid", () => {
      mockReq.headers = { authorization: "Bearer bad_token" };
      vi.spyOn(jwt, "verify").mockImplementation(() => {
        throw new jwt.TokenExpiredError("jwt expired", new Date());
      });

      authenticate(mockReq as Request, mockRes as Response, next);

      expect(sendResponse).toHaveBeenCalledWith(
        mockRes,
        StatusCodes.UNAUTHORIZED,
        "Token expired.",
      );
    });

    it("harus menolak request jika format token malformed (bukan JWT valid)", () => {
      mockReq.headers = { authorization: "Bearer token_ngasal_bukan_jwt" };

      vi.spyOn(jwt, "verify").mockImplementation(() => {
        throw new jwt.JsonWebTokenError("invalid token");
      });

      authenticate(mockReq as Request, mockRes as Response, next);

      expect(sendResponse).toHaveBeenCalledWith(
        mockRes,
        StatusCodes.UNAUTHORIZED,
        "Invalid token.", // Disesuaikan dengan implementasi asli
      );
    });
  });

  describe("requireRole", () => {
    it("harus mengizinkan akses jika role user sesuai", () => {
      mockReq.user = {
        userId: 1,
        username: "Admin",
        email: "a@a.com",
        role: Role.ADMIN,
      };

      mockReq.log = { info: vi.fn() } as any;

      const middleware = requireRole([Role.ADMIN]);
      middleware(mockReq as Request, mockRes as Response, next);

      expect(next).toHaveBeenCalled();
    });

    it("harus melarang akses (403) jika role user tidak sesuai", () => {
      mockReq.user = {
        userId: 1,
        username: "Pekerja",
        email: "a@a.com",
        role: Role.CUSTOMER,
      };
      mockReq.log = { info: vi.fn() } as any;

      const middleware = requireRole([Role.ADMIN]);
      middleware(mockReq as Request, mockRes as Response, next);

      expect(sendResponse).toHaveBeenCalledWith(
        mockRes,
        StatusCodes.FORBIDDEN,
        expect.any(String),
      );
    });
  });
});
