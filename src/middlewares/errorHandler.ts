import type { Request, Response, NextFunction } from "express";
import multer from "multer";
import { Prisma } from "@prisma/client";
import { sendResponse } from "../utils/response";
import { env } from "../config/env";
import { StatusCodes } from "http-status-codes";
import { ZodError } from "zod";
import { AppError } from "../domain/errors/AppError.js";
import {
  MAX_UPLOAD_FILE_SIZE_MB,
} from "./upload.js";
import * as Sentry from "@sentry/node";

const multerErrorMessage = (code: multer.MulterError["code"]): string => {
  switch (code) {
    case "LIMIT_FILE_SIZE":
      return `Ukuran file terlalu besar. Maksimal ukuran file adalah ${MAX_UPLOAD_FILE_SIZE_MB} MB.`;
    case "LIMIT_FILE_COUNT":
      return "Jumlah file melebihi batas yang diizinkan.";
    case "LIMIT_UNEXPECTED_FILE":
      return "Field file tidak valid untuk endpoint ini.";
    case "LIMIT_PART_COUNT":
      return "Jumlah bagian form melebihi batas yang diizinkan.";
    case "LIMIT_FIELD_KEY":
      return "Nama field form terlalu panjang.";
    case "LIMIT_FIELD_VALUE":
      return "Nilai field form terlalu panjang.";
    case "LIMIT_FIELD_COUNT":
      return "Jumlah field form melebihi batas yang diizinkan.";
    default:
      return "Gagal mengunggah file.";
  }
};

const prismaErrorMessage = (err: Prisma.PrismaClientKnownRequestError): string => {
  switch (err.code) {
    case "P2002":
      return "Data duplikat. Nilai yang unik sudah terdaftar sebelumnya.";
    case "P2003":
      return "Data tidak dapat disimpan karena masih terhubung ke data lain.";
    case "P2021":
      return "Database belum diperbarui. Tabel yang dibutuhkan belum tersedia.";
    case "P2022":
      return "Database belum diperbarui. Kolom yang dibutuhkan belum tersedia.";
    case "P2028":
      return "Operasi database melebihi batas waktu. Silakan coba lagi.";
    default:
      return "Terjadi kesalahan saat mengakses database.";
  }
};

export const notFoundHandler = (req: Request, res: Response): void => {
  sendResponse(
    res,
    StatusCodes.NOT_FOUND,
    `Endpoint ${req.originalUrl} not found`,
  );
};

export const globalErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  req.log?.error(err);

  const isProd = env.NODE_ENV === "production";
  let statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
  let message = "Internal Server Error";
  let errorsDetail: unknown = undefined;

  if (
    err instanceof SyntaxError &&
    "status" in err &&
    err.status === 400 &&
    "body" in err
  ) {
    statusCode = StatusCodes.BAD_REQUEST;
    message = "Invalid JSON payload passed";
    errorsDetail = { detail: err.message };
  } else if (err instanceof ZodError) {
    statusCode = StatusCodes.BAD_REQUEST;
    message = "Validation Error";
    errorsDetail = err.issues.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
  } else if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof multer.MulterError) {
    statusCode =
      err.code === "LIMIT_FILE_SIZE"
        ? StatusCodes.REQUEST_TOO_LONG
        : StatusCodes.BAD_REQUEST;
    message = multerErrorMessage(err.code);
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    statusCode =
      err.code === "P2002"
        ? StatusCodes.CONFLICT
        : err.code === "P2021" || err.code === "P2022"
          ? StatusCodes.SERVICE_UNAVAILABLE
          : err.code === "P2028"
            ? StatusCodes.GATEWAY_TIMEOUT
            : StatusCodes.INTERNAL_SERVER_ERROR;
    message = prismaErrorMessage(err);
    if (!isProd) {
      errorsDetail = { code: err.code, detail: err.message };
    }
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = StatusCodes.BAD_REQUEST;
    message = "Data yang dikirim tidak valid untuk operasi database.";
    if (!isProd) {
      errorsDetail = { detail: err.message };
    }
  } else if (
    err.message.includes("Unknown column") ||
    err.message.includes("does not exist in the current database")
  ) {
    statusCode = StatusCodes.SERVICE_UNAVAILABLE;
    message = "Database belum diperbarui. Kolom yang dibutuhkan belum tersedia.";
    if (!isProd) {
      errorsDetail = { detail: err.message };
    }
  }

  if (statusCode === StatusCodes.INTERNAL_SERVER_ERROR) {
    Sentry.captureException(err);
  }

  const shouldShowStack =
    !isProd && statusCode === StatusCodes.INTERNAL_SERVER_ERROR;

  sendResponse(
    res,
    statusCode,
    message,
    null,
    errorsDetail ??
      (shouldShowStack
        ? { message: err.message, stack: err.stack }
        : undefined),
  );
};
