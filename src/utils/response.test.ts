import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Response } from "express";
import { sendResponse } from "./response";

describe("Utils: sendResponse", () => {
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
  });

  it("harus mengirim response success (true) untuk status code 2xx", () => {
    const data = { id: 1, name: "Test" };

    sendResponse(mockResponse as Response, 200, "Berhasil", data);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: true,
      message: "Berhasil",
      data: data,
    });
  });

  it("harus mengirim response success (false) untuk status code 4xx/5xx", () => {
    sendResponse(mockResponse as Response, 404, "Tidak ditemukan");

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      message: "Tidak ditemukan",
      data: null,
    });
  });

  it("harus menyertakan object error jika argumen error diberikan", () => {
    const errorDetail = { detail: "Field name is required" };

    sendResponse(
      mockResponse as Response,
      400,
      "Validasi Gagal",
      null,
      errorDetail,
    );

    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: errorDetail,
      }),
    );
  });
});
