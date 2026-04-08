import type { Request, Response } from "express";
import { sendResponse } from "../../utils/response";
import type { ApiResponse } from "../../types/response";
import { prisma } from "../../infrastructure/database/prisma";
import { StatusCodes } from "http-status-codes";

export const checkHealth = async (
  _req: Request,
  res: Response<ApiResponse>,
): Promise<void> => {
  await prisma.$queryRaw`SELECT 1`;
  sendResponse(res, StatusCodes.OK, "API & Database healthy");
};
