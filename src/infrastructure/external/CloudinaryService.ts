import { v2 as cloudinary } from "cloudinary";
import { env } from "../../config/env";
import { AppError } from "../../domain/errors/AppError";
import { StatusCodes } from "http-status-codes";
import sharp from "sharp";
import { isPdfBuffer, unlockPdf } from "../utils/pdfUtils.js";

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

/** Ambil public_id lengkap dari URL Cloudinary untuk operasi destroy. */
export function extractCloudinaryPublicId(imageUrl: string): string | null {
  const uploadIdx = imageUrl.indexOf("/upload/");
  if (uploadIdx === -1) return null;
  let path = imageUrl.slice(uploadIdx + "/upload/".length);
  // Lewati segmen transformasi (berisi koma) hingga path folder/file
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
    return "Ukuran file terlalu besar. Silakan unggah file yang lebih kecil.";
  }

  if (msg.includes("invalid") || msg.includes("unsupported")) {
    return "Format file tidak didukung. Gunakan gambar (JPG/PNG) atau PDF.";
  }

  return "Gagal mengunggah file ke penyimpanan cloud. Silakan coba lagi.";
}

export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
    });
  }
  async uploadFile(
    buffer: Buffer,
    folder = "bumantara",
    pdfPassword?: string,
  ): Promise<string> {
    const isPdf = isPdfBuffer(buffer);
    const finalBuffer = isPdf ? unlockPdf(buffer, pdfPassword) : buffer;
    // PDF → raw (stabil di production). Non-PDF (gambar/dll) → auto seperti sebelumnya.
    const uploadOptions = isPdf
      ? { folder, resource_type: "raw" as const, format: "pdf" as const }
      : { folder, resource_type: "auto" as const };

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            return reject(
              new AppError(
                StatusCodes.INTERNAL_SERVER_ERROR,
                toCloudinaryUploadErrorMessage(error),
              ),
            );
          }
          try {
            resolve(assertSecureUrl(result));
          } catch (err) {
            reject(err);
          }
        },
      );
      uploadStream.end(finalBuffer);
    });
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

      const compressedBuffer = await sharp(buffer)
        .resize({ width: 800, withoutEnlargement: true })
        .flatten({ background: "#ffffff" })
        .jpeg({ quality: 80 })
        .toBuffer();

      return await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: folder,
            resource_type: "image",
          },
          (error, result) => {
            if (error) {
              console.error("Cloudinary Upload Error:", error);
              return reject(
                new AppError(
                  StatusCodes.INTERNAL_SERVER_ERROR,
                  toCloudinaryUploadErrorMessage(error),
                ),
              );
            }
            try {
              resolve(assertSecureUrl(result));
            } catch (err) {
              reject(err);
            }
          },
        );
        uploadStream.end(compressedBuffer);
      });
    } catch (error: any) {
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
    try {
      const trimmed = imageUrl?.trim();
      if (!trimmed) return;
      const publicId = extractCloudinaryPublicId(trimmed);
      if (!publicId) return;
      // Coba kedua tipe — file lama bisa image/upload atau raw/upload
      await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
      await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
      console.log(`Berhasil rollback file dari Cloudinary: ${publicId}`);
    } catch (error) {
      console.error("Gagal melakukan rollback file di Cloudinary:", error);
    }
  }
}
