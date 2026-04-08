import { describe, it, expect, vi, beforeEach } from "vitest";
import { CloudinaryService } from "./CloudinaryService";
import { v2 as cloudinary } from "cloudinary";
import { AppError } from "../../domain/errors/AppError";
import sharp from "sharp";

vi.mock("cloudinary");
vi.mock("sharp", () => ({
  default: () => ({
    resize: () => ({
      jpeg: () => ({
        toBuffer: vi.fn().mockResolvedValue(Buffer.from("resized-buffer")),
      }),
    }),
  }),
}));

describe("CloudinaryService", () => {
  let service: CloudinaryService;

  beforeEach(() => {
    service = new CloudinaryService();
    vi.clearAllMocks();
  });

  it("harus mengembalikan URL secure jika upload berhasil", async () => {
    const mockUploadStream = vi.fn((options, callback) => {
      callback(null, { secure_url: "https://cloudinary.com/image.jpg" });
      return { end: vi.fn() };
    });

    (cloudinary.uploader.upload_stream as any) = mockUploadStream;

    const result = await service.uploadImage(Buffer.from("image"));

    expect(result).toBe("https://cloudinary.com/image.jpg");
    expect(mockUploadStream).toHaveBeenCalled();
  });

  it("harus melempar AppError jika upload gagal (Error dari Cloudinary)", async () => {
    const mockUploadStream = vi.fn((options, callback) => {
      callback(new Error("Cloudinary down"), null);
      return { end: vi.fn() };
    });

    (cloudinary.uploader.upload_stream as any) = mockUploadStream;

    await expect(service.uploadImage(Buffer.from("image"))).rejects.toThrow(
      AppError,
    );
  });

  it("harus melempar AppError jika result dari Cloudinary kosong/null", async () => {
    const mockUploadStream = vi.fn((options, callback) => {
      callback(null, null);
      return { end: vi.fn() };
    });

    (cloudinary.uploader.upload_stream as any) = mockUploadStream;

    await expect(service.uploadImage(Buffer.from("image"))).rejects.toThrow(
      "Gagal mendapatkan respon",
    );
  });
});
