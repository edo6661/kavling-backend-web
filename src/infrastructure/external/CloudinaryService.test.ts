import { describe, it, expect, vi, beforeEach } from "vitest";
import { CloudinaryService } from "./CloudinaryService";
import { v2 as cloudinary } from "cloudinary";
import { AppError } from "../../domain/errors/AppError";
import sharp from "sharp";

vi.mock("cloudinary");
vi.mock("../utils/pdfUtils.js", () => ({
  isPdfBuffer: (buf: Buffer) =>
    buf.length > 4 &&
    buf[0] === 0x25 &&
    buf[1] === 0x50 &&
    buf[2] === 0x44 &&
    buf[3] === 0x46,
  unlockPdf: (buf: Buffer) => buf,
}));
vi.mock("sharp", () => ({
  default: () => ({
    resize: () => ({
      flatten: () => ({
        jpeg: () => ({
          toBuffer: vi.fn().mockResolvedValue(Buffer.from("resized-buffer")),
        }),
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

  it("harus melempar AppError dengan pesan ramah pengguna jika upload gagal (Error dari Cloudinary)", async () => {
    const mockUploadStream = vi.fn((options, callback) => {
      callback(new Error("Request Timeout"), null);
      return { end: vi.fn() };
    });

    (cloudinary.uploader.upload_stream as any) = mockUploadStream;

    await expect(service.uploadImage(Buffer.from("image"))).rejects.toThrow(
      /koneksi terlalu lama/,
    );
  });

  it("harus melempar AppError jika result dari Cloudinary kosong/null", async () => {
    const mockUploadStream = vi.fn((options, callback) => {
      callback(null, null);
      return { end: vi.fn() };
    });

    (cloudinary.uploader.upload_stream as any) = mockUploadStream;

    await expect(service.uploadImage(Buffer.from("image"))).rejects.toThrow(
      /penyimpanan cloud/,
    );
  });

  it("uploadFile non-PDF memakai resource_type auto (gambar kavling/progress)", async () => {
    const mockUploadStream = vi.fn((options, callback) => {
      expect(options.resource_type).toBe("auto");
      expect(options.format).toBeUndefined();
      callback(null, { secure_url: "https://cloudinary.com/kavling.jpg" });
      return { end: vi.fn() };
    });
    (cloudinary.uploader.upload_stream as any) = mockUploadStream;

    const result = await service.uploadFile(Buffer.from("not-a-pdf"));
    expect(result).toBe("https://cloudinary.com/kavling.jpg");
  });

  it("uploadFile PDF di atas 10 MB tanpa R2 ditolak dengan pesan limit Cloudinary", async () => {
    const pdfHeader = Buffer.alloc(11 * 1024 * 1024, 0);
    pdfHeader.set(Buffer.from("%PDF"), 0);

    const mockUploadStream = vi.fn();
    (cloudinary.uploader.upload_stream as any) = mockUploadStream;

    await expect(service.uploadFile(pdfHeader)).rejects.toMatchObject({
      statusCode: 413,
      message: expect.stringMatching(/10 MB|Cloudinary|R2/i),
    });
    expect(mockUploadStream).not.toHaveBeenCalled();
  });

  it("harus melempar AppError jika upload PDF (raw) tidak mengembalikan secure_url", async () => {
    const pdfHeader = Buffer.from("%PDF-1.4 dummy");
    const mockUploadStream = vi.fn((options, callback) => {
      expect(options.resource_type).toBe("raw");
      expect(options.format).toBe("pdf");
      callback(null, { public_id: "bumantara/kode-billing-pph/x" });
      return { end: vi.fn() };
    });

    (cloudinary.uploader.upload_stream as any) = mockUploadStream;

    await expect(service.uploadImage(pdfHeader)).rejects.toThrow(
      /penyimpanan cloud/,
    );
  });
});
