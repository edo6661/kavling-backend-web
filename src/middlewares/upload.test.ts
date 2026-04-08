import { describe, it, expect, vi } from "vitest";
import { upload } from "./upload";
import { AppError } from "../domain/errors/AppError";
import { StatusCodes } from "http-status-codes";

describe("Upload Middleware (Multer Config)", () => {
  const fileFilter = (upload as any).fileFilter;

  it("harus mengizinkan file dengan mimetype gambar (image/jpeg, image/png)", () => {
    const mockFile = { mimetype: "image/jpeg" };
    const cb = vi.fn();

    fileFilter({}, mockFile, cb);

    expect(cb).toHaveBeenCalledWith(null, true);
  });

  it("harus menolak file non-gambar dengan AppError 400", () => {
    const mockFile = { mimetype: "application/pdf" };
    const cb = vi.fn();

    fileFilter({}, mockFile, cb);

    const errorArg = cb.mock.calls[0]?.[0];

    expect(errorArg).toBeDefined();
    expect(errorArg).toBeInstanceOf(AppError);

    const appError = errorArg as AppError;
    expect(appError.statusCode).toBe(StatusCodes.BAD_REQUEST);
    expect(appError.message).toContain("Hanya file gambar");
  });
});
