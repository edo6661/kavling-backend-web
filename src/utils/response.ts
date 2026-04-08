// src/utils/response.ts
import type { Response } from "express";
import type { ApiResponse } from "../types/response";

export const sendResponse = <T>(
  res: Response<ApiResponse<T>>,
  statusCode: number,
  message: string,
  data: T | null = null,
  error?: unknown,
): void => {
  res.status(statusCode).json({
    success: statusCode >= 200 && statusCode < 300,
    message,
    data,
    ...(error ? { error } : {}),
  });
};
