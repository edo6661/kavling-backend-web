import type { Request, Response, NextFunction } from "express";
import { sendResponse } from "../utils/response";
import { env } from "../config/env";
import { StatusCodes } from "http-status-codes";
import { ZodError } from "zod";
import { AppError } from "../domain/errors/AppError.js";
import * as Sentry from "@sentry/node";

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
