import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Request, Response } from "express";
import { checkHealth } from "./healthController";
import { prisma } from "../../infrastructure/database/prisma";
import { StatusCodes } from "http-status-codes";

vi.mock("../../utils/response", () => ({
  sendResponse: vi.fn(),
}));

import { sendResponse } from "../../utils/response";

describe("HealthController", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("harus mengembalikan status 200 OK jika API dan Database sehat", async () => {
    const dbSpy = vi.spyOn(prisma, "$queryRaw").mockResolvedValue([{ 1: 1 }]);

    await checkHealth(mockRequest as Request, mockResponse as Response);

    expect(dbSpy).toHaveBeenCalledTimes(1);
    expect(sendResponse).toHaveBeenCalledWith(
      mockResponse,
      StatusCodes.OK,
      "API & Database healthy",
    );
  });

  it("harus melempar error jika database mati", async () => {
    const dbError = new Error("Connection refused");

    vi.spyOn(prisma, "$queryRaw").mockRejectedValue(dbError);

    await expect(
      checkHealth(mockRequest as Request, mockResponse as Response),
    ).rejects.toThrow(dbError);

    expect(sendResponse).not.toHaveBeenCalled();
  });
});
