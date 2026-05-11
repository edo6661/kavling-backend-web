import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import { env } from "../config/env";
import { sendResponse } from "../utils/response";
import type { JwtUserPayload } from "../domain/dtos/UserDTO";
import { prisma } from "../infrastructure/database/prisma.js";

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    sendResponse(
      res,
      StatusCodes.UNAUTHORIZED,
      "Access denied. No token provided.",
    );
    return;
  }

  const token = authHeader.split(" ").pop()?.trim();

  if (!token) {
    sendResponse(
      res,
      StatusCodes.UNAUTHORIZED,
      "Access denied. Invalid token format.",
    );
    return;
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtUserPayload;
    req.user = decoded;
    next();
  } catch (error) {
    let message = "Invalid token.";
    if (error instanceof jwt.TokenExpiredError) {
      message = "Token expired.";
    }
    sendResponse(res, StatusCodes.UNAUTHORIZED, message);
  }
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendResponse(res, StatusCodes.UNAUTHORIZED, "User not authenticated");
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      sendResponse(
        res,
        StatusCodes.FORBIDDEN,
        "You do not have permission to access this resource",
      );
      return;
    }

    next();
  };
};
export const requirePermission = (
  resource: string | string[],
  action: "create" | "read" | "update" | "delete",
) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    if (!req.user) {
      sendResponse(res, StatusCodes.UNAUTHORIZED, "User not authenticated");
      return;
    }

    if (req.user.role === "SUPERADMIN") {
      return next();
    }

    try {
      const resourceArray = Array.isArray(resource) ? resource : [resource];

      // 1. Ubah jadi findMany untuk menarik semua baris yang cocok
      const permissions = await prisma.rolePermission.findMany({
        where: {
          role: req.user.role,
          resource: { in: resourceArray.map((r) => r.toUpperCase()) },
        },
      });

      // 2. Lakukan perulangan untuk mengecek apakah ada MINIMAL SATU yang true
      let isAllowed = false;
      for (const p of permissions) {
        if (action === "create" && p.canCreate) isAllowed = true;
        if (action === "read" && p.canRead) isAllowed = true;
        if (action === "update" && p.canUpdate) isAllowed = true;
        if (action === "delete" && p.canDelete) isAllowed = true;

        if (isAllowed) break; // Jika sudah ketemu 1 yang true, hemat performa, hentikan loop
      }

      if (!isAllowed) {
        sendResponse(
          res,
          StatusCodes.FORBIDDEN,
          `Role Anda (${req.user.role}) tidak memiliki akses untuk ${action.toUpperCase()} data pada modul ini.`,
        );
        return;
      }

      next();
    } catch (_) {
      sendResponse(
        res,
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Gagal memverifikasi hak akses",
      );
    }
  };
};
