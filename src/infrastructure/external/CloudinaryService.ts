import { v2 as cloudinary } from "cloudinary";
import { env } from "../../config/env";
import { AppError } from "../../domain/errors/AppError";
import { StatusCodes } from "http-status-codes";
import sharp from "sharp";
import { isPdfBuffer, unlockPdf } from "../utils/pdfUtils.js";
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
    const finalBuffer = isPdfBuffer(buffer)
      ? unlockPdf(buffer, pdfPassword)
      : buffer;

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder, resource_type: "auto" },
        (error, result) => {
          if (error) {
            return reject(
              new AppError(
                StatusCodes.INTERNAL_SERVER_ERROR,
                `Gagal upload file: ${error.message || "Unknown Cloudinary Error"}`,
              ),
            );
          }
          resolve(result!.secure_url);
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
                  "Gagal mengunggah gambar ke penyimpanan cloud.",
                ),
              );
            }
            if (!result) {
              return reject(
                new AppError(
                  StatusCodes.INTERNAL_SERVER_ERROR,
                  "Gagal mendapatkan respon dari penyimpanan cloud.",
                ),
              );
            }
            resolve(result.secure_url);
          },
        );
        uploadStream.end(compressedBuffer);
      });
    } catch (error: any) {
      console.error("File Processing Error:", error);

      if (error instanceof AppError) {
        throw error;
      }

      const errMessage =
        error instanceof Error
          ? error.message
          : "File rusak atau format tidak didukung.";

      throw new AppError(
        StatusCodes.BAD_REQUEST,
        `Gagal memproses gambar: ${errMessage}`,
        true,
      );
    }
  }
  async deleteImageByUrl(imageUrl: string): Promise<void> {
    try {
      const urlParts = imageUrl.split("/");
      const filenameWithExt = urlParts.pop();
      const folder = urlParts.pop();
      if (!filenameWithExt || !folder) return;
      const filename = filenameWithExt.split(".")[0];
      const publicId = `${folder}/${filename}`;
      await cloudinary.uploader.destroy(publicId);
      console.log(`Berhasil rollback file dari Cloudinary: ${publicId}`);
    } catch (error) {
      console.error("Gagal melakukan rollback file di Cloudinary:", error);
    }
  }
}
