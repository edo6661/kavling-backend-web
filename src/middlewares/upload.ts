import multer from "multer";
import { AppError } from "../domain/errors/AppError";
import { StatusCodes } from "http-status-codes";

export const MAX_UPLOAD_FILE_SIZE_BYTES = 20 * 1024 * 1024;
export const MAX_UPLOAD_FILE_SIZE_MB = MAX_UPLOAD_FILE_SIZE_BYTES / (1024 * 1024);

const storage = multer.memoryStorage();
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: MAX_UPLOAD_FILE_SIZE_BYTES,
  },
  fileFilter: (_req, file, cb) => {
    if (
      file.mimetype.startsWith("image/") ||
      file.mimetype === "application/pdf"
    ) {
      cb(null, true);
    } else {
      cb(
        new AppError(
          StatusCodes.BAD_REQUEST,
          "Hanya file gambar dan PDF yang diperbolehkan!",
          true,
        ),
      );
    }
  },
});
