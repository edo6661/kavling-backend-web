import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response, NextFunction } from "express";
import multer from "multer";
import { globalErrorHandler } from "./errorHandler";
import { NotFoundError } from "../domain/errors/NotFoundError";
import { ConflictError } from "../domain/errors/ConflictError";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { env } from "../config/env";
import { MAX_UPLOAD_FILE_SIZE_MB } from "./upload";

describe("Global Error Handler Middleware", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      log: { error: vi.fn() } as unknown as Request["log"],
    };
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    nextFunction = vi.fn();
  });

  it("harus menangani AppError (seperti NotFoundError) dengan status dan pesan yang sesuai", () => {
    const error = new NotFoundError("Data dummy tidak ditemukan");

    globalErrorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      nextFunction,
    );

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Data dummy tidak ditemukan",
      }),
    );
  });
  it("harus menangani AppError spesifik seperti ConflictError dengan status HTTP 409", () => {
    const error = new ConflictError("Data dengan nama tersebut sudah ada");

    globalErrorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      nextFunction,
    );

    expect(mockResponse.status).toHaveBeenCalledWith(409);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Data dengan nama tersebut sudah ada",
      }),
    );
  });

  it("harus menangani ZodError dan memformat detail error validasi", () => {
    const schema = z.object({ name: z.string().min(3) });
    const result = schema.safeParse({ name: "A" });
    const error = (result as z.ZodSafeParseError<unknown>).error;

    globalErrorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      nextFunction,
    );

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Validation Error",
        error: expect.arrayContaining([
          expect.objectContaining({ field: "name" }),
        ]),
      }),
    );
  });

  it("harus menangani Generic Error (500) dan menyembunyikan stack trace jika dipaksa sebagai production", () => {
    const error = new Error("Sesuatu yang sangat buruk terjadi pada database");

    const originalEnv = env.NODE_ENV;

    env.NODE_ENV = "production";

    globalErrorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      nextFunction,
    );

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Internal Server Error",
      }),
    );

    const jsonCallArgs = (mockResponse.json as ReturnType<typeof vi.fn>).mock
      .calls[0]?.[0];
    expect(jsonCallArgs.error).toBeUndefined();

    env.NODE_ENV = originalEnv;
  });

  it("harus memanggil req.log.error untuk keperluan logging internal", () => {
    const error = new Error("Test error logging");

    globalErrorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      nextFunction,
    );

    expect(mockRequest.log?.error).toHaveBeenCalledTimes(1);
    expect(mockRequest.log?.error).toHaveBeenCalledWith(error);
  });
  it("harus menangani MulterError LIMIT_FILE_SIZE dengan status 413 dan pesan yang jelas", () => {
    const error = new multer.MulterError("LIMIT_FILE_SIZE", "file");

    globalErrorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      nextFunction,
    );

    expect(mockResponse.status).toHaveBeenCalledWith(413);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: `Ukuran file terlalu besar. Maksimal ukuran file adalah ${MAX_UPLOAD_FILE_SIZE_MB} MB.`,
      }),
    );
  });

  it("harus menangani Prisma P2022 (kolom belum ada) dengan pesan yang jelas", () => {
    const error = new Prisma.PrismaClientKnownRequestError(
      "The column `nama_bank` does not exist in the current database.",
      { code: "P2022", clientVersion: "6.19.2" },
    );

    globalErrorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      nextFunction,
    );

    expect(mockResponse.status).toHaveBeenCalledWith(503);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message:
          "Database belum diperbarui. Kolom yang dibutuhkan belum tersedia.",
      }),
    );
  });

  it("harus menangani SyntaxError (Malformed JSON) dari express body parser", () => {
    const error = new SyntaxError("Unexpected string in JSON");
    // Mocking properti tambahan yang disisipkan oleh body-parser express
    (error as any).status = 400;
    (error as any).body = "{ bad json }";

    globalErrorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      nextFunction,
    );

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Invalid JSON payload passed",
      }),
    );
  });
});
