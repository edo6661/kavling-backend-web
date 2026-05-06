import { v2 as cloudinary } from "cloudinary";
import { env } from "../../config/env";
import { AppError } from "../../domain/errors/AppError";
import { StatusCodes } from "http-status-codes";
import sharp from "sharp";

export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
    });
  }
  async uploadFile(buffer: Buffer, folder = "bumantara"): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: "auto",
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary Upload Error Details:", error);
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
      uploadStream.end(buffer);
    });
  }

  async uploadImage(buffer: Buffer, folder = "bumantara"): Promise<string> {
    try {
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
      console.error("Sharp Image Processing Error:");
      console.error(error);
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "Format file tidak didukung atau file rusak. Khusus unggahan ini, pastikan Anda menggunakan file gambar (JPG/PNG) yang valid.",
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
      console.log(`Berhasil rollback gambar dari Cloudinary: ${publicId}`);
    } catch (error) {
      console.error("Gagal melakukan rollback gambar di Cloudinary:", error);
    }
  }
}
