import multer from "multer";
import { AppError } from "../domain/errors/AppError";
import { StatusCodes } from "http-status-codes";

const storage = multer.memoryStorage();
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
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
