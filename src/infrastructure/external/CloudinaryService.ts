import { v2 as cloudinary } from "cloudinary";
import { env } from "../../config/env";
import { AppError } from "../../domain/errors/AppError";
import { StatusCodes } from "http-status-codes";
import { isPdfBuffer, unlockPdf } from "../utils/pdfUtils.js";
import {
  CLOUDINARY_MAX_IMAGE_FILE_BYTES,
  CLOUDINARY_MAX_IMAGE_FILE_MB,
  CLOUDINARY_MAX_RAW_FILE_BYTES,
  CLOUDINARY_MAX_RAW_FILE_MB,
} from "./cloudinaryLimits.js";
import { compressImageForUpload } from "./imageUploadUtils.js";
import { isR2Configured } from "./r2Config.js";
import { isR2StorageUrl, R2StorageService } from "./R2StorageService.js";

function assertSecureUrl(
  result: { secure_url?: string } | null | undefined,
): string {
  const url = result?.secure_url?.trim();
  if (!url || !url.startsWith("http")) {
    throw new AppError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Gagal mendapatkan URL file dari penyimpanan cloud. Silakan coba unggah lagi.",
    );
  }
  return url;
}

function cloudinaryLimitExceededMessage(isPdf: boolean): string {
  if (isR2Configured()) {
    return isPdf
      ? `Ukuran PDF melebihi ${CLOUDINARY_MAX_RAW_FILE_MB} MB (limit Cloudinary) dan penyimpanan cadangan tidak tersedia.`
      : `Ukuran gambar melebihi ${CLOUDINARY_MAX_IMAGE_FILE_MB} MB (limit Cloudinary) setelah dikompresi.`;
  }
  return isPdf
    ? `Ukuran file PDF terlalu besar. Maksimal ${CLOUDINARY_MAX_RAW_FILE_MB} MB di Cloudinary. Kompres file atau hubungi admin untuk mengaktifkan penyimpanan R2.`
    : `Ukuran file gambar terlalu besar. Maksimal ${CLOUDINARY_MAX_IMAGE_FILE_MB} MB di Cloudinary. Kompres file atau hubungi admin.`;
}

/** Ambil public_id lengkap dari URL Cloudinary untuk operasi destroy. */
export function extractCloudinaryPublicId(imageUrl: string): string | null {
  const uploadIdx = imageUrl.indexOf("/upload/");
  if (uploadIdx === -1) return null;
  let path = imageUrl.slice(uploadIdx + "/upload/".length);
  const segments = path.split("/");
  while (segments.length > 0 && segments[0]!.includes(",")) {
    segments.shift();
  }
  path = segments.join("/");
  if (!path) return null;
  const lastDot = path.lastIndexOf(".");
  if (lastDot > 0) return path.slice(0, lastDot);
  return path;
}

function toCloudinaryUploadErrorMessage(
  error: { message?: string } | string | undefined,
): string {
  const raw =
    typeof error === "string" ? error : (error?.message?.trim() ?? "");
  const msg = raw.toLowerCase();

  if (
    msg.includes("timeout") ||
    msg.includes("timed out") ||
    msg.includes("econnaborted") ||
    msg.includes("etimedout")
  ) {
    return "Unggah file gagal karena koneksi terlalu lama. Periksa koneksi internet Anda, kurangi ukuran file, lalu coba lagi.";
  }

  if (
    msg.includes("network") ||
    msg.includes("econnreset") ||
    msg.includes("enotfound") ||
    msg.includes("socket") ||
    msg.includes("getaddrinfo")
  ) {
    return "Unggah file gagal karena gangguan jaringan. Silakan coba lagi dalam beberapa saat.";
  }

  if (msg.includes("file size") || msg.includes("too large")) {
    return `Ukuran file melebihi batas akun Cloudinary (PDF/dokumen maks. ${CLOUDINARY_MAX_RAW_FILE_MB} MB, gambar maks. ${CLOUDINARY_MAX_IMAGE_FILE_MB} MB).`;
  }

  if (msg.includes("invalid") || msg.includes("unsupported")) {
    return "Format file tidak didukung. Gunakan gambar (JPG/PNG) atau PDF.";
  }

  return "Gagal mengunggah file ke penyimpanan cloud. Silakan coba lagi.";
}

function isCloudinaryFileSizeError(
  error: { message?: string } | string | undefined,
): boolean {
  const msg = (
    typeof error === "string" ? error : (error?.message?.trim() ?? "")
  ).toLowerCase();
  return msg.includes("file size") || msg.includes("too large");
}

function toCloudinaryUploadAppError(
  error: { message?: string } | string | undefined,
): AppError {
  const statusCode = isCloudinaryFileSizeError(error)
    ? StatusCodes.REQUEST_TOO_LONG
    : StatusCodes.INTERNAL_SERVER_ERROR;
  return new AppError(
    statusCode,
    toCloudinaryUploadErrorMessage(error),
    true,
  );
}

export class CloudinaryService {
  private readonly r2: R2StorageService | null;

  constructor() {
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
    });
    this.r2 = isR2Configured() ? new R2StorageService() : null;
  }

  private uploadBufferToCloudinary(
    buffer: Buffer,
    uploadOptions: Record<string, unknown>,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            return reject(toCloudinaryUploadAppError(error));
          }
          try {
            resolve(assertSecureUrl(result));
          } catch (err) {
            reject(err);
          }
        },
      );
      uploadStream.end(buffer);
    });
  }

  private async uploadToR2(
    buffer: Buffer,
    folder: string,
    options: { contentType: string; extension: string },
  ): Promise<string> {
    if (!this.r2) {
      throw new AppError(
        StatusCodes.REQUEST_TOO_LONG,
        cloudinaryLimitExceededMessage(options.contentType === "application/pdf"),
        true,
      );
    }
    return this.r2.upload(buffer, folder, options);
  }

  async uploadFile(
    buffer: Buffer,
    folder = "bumantara",
    pdfPassword?: string,
  ): Promise<string> {
    const isPdf = isPdfBuffer(buffer);
    const finalBuffer = isPdf ? unlockPdf(buffer, pdfPassword) : buffer;

    if (isPdf && finalBuffer.length > CLOUDINARY_MAX_RAW_FILE_BYTES) {
      return this.uploadToR2(finalBuffer, folder, {
        contentType: "application/pdf",
        extension: ".pdf",
      });
    }

    if (!isPdf && finalBuffer.length > CLOUDINARY_MAX_IMAGE_FILE_BYTES) {
      return this.uploadToR2(finalBuffer, folder, {
        contentType: "application/octet-stream",
        extension: "",
      });
    }

    const uploadOptions = isPdf
      ? { folder, resource_type: "raw" as const, format: "pdf" as const }
      : { folder, resource_type: "auto" as const };

    try {
      return await this.uploadBufferToCloudinary(finalBuffer, uploadOptions);
    } catch (error) {
      if (
        error instanceof AppError &&
        error.statusCode === StatusCodes.REQUEST_TOO_LONG &&
        this.r2
      ) {
        return this.uploadToR2(finalBuffer, folder, {
          contentType: isPdf ? "application/pdf" : "application/octet-stream",
          extension: isPdf ? ".pdf" : "",
        });
      }
      throw error;
    }
  }

  async uploadImage(
    buffer: Buffer,
    folder = "bumantara",
    pdfPassword?: string,
  ): Promise<string> {
    try {
      if (isPdfBuffer(buffer)) {
        return await this.uploadFile(buffer, folder, pdfPassword);
      }

      const compressedBuffer = await compressImageForUpload(buffer);

      if (compressedBuffer.length > CLOUDINARY_MAX_IMAGE_FILE_BYTES) {
        return this.uploadToR2(compressedBuffer, folder, {
          contentType: "image/jpeg",
          extension: ".jpg",
        });
      }

      return await this.uploadBufferToCloudinary(compressedBuffer, {
        folder,
        resource_type: "image",
      });
    } catch (error: unknown) {
      console.error("File Processing Error:", error);

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "File rusak atau format tidak didukung. Pastikan file gambar/PDF valid.",
        true,
      );
    }
  }

  async deleteImageByUrl(imageUrl: string): Promise<void> {
    const trimmed = imageUrl?.trim();
    if (!trimmed) return;

    if (this.r2 && isR2StorageUrl(trimmed)) {
      try {
        await this.r2.deleteByUrl(trimmed);
      } catch (error) {
        console.error("Gagal melakukan rollback file di R2:", error);
      }
      return;
    }

    try {
      const publicId = extractCloudinaryPublicId(trimmed);
      if (!publicId) return;
      await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
      await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
      console.log(`Berhasil rollback file dari Cloudinary: ${publicId}`);
    } catch (error) {
      console.error("Gagal melakukan rollback file di Cloudinary:", error);
    }
  }
}
