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
  resource: string,
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

    // Bypass jika SUPERADMIN agar tidak perlu setting permission satu-satu (Opsional, tapi best practice)
    if (req.user.role === "SUPERADMIN") {
      return next();
    }

    try {
      const permission = await prisma.rolePermission.findUnique({
        where: {
          role_resource: {
            role: req.user.role,
            resource: resource.toUpperCase(),
          },
        },
      });

      // Pengecekan Action
      let isAllowed = false;
      if (permission) {
        if (action === "create") isAllowed = permission.canCreate;
        if (action === "read") isAllowed = permission.canRead;
        if (action === "update") isAllowed = permission.canUpdate;
        if (action === "delete") isAllowed = permission.canDelete;
      }

      if (!isAllowed) {
        sendResponse(
          res,
          StatusCodes.FORBIDDEN,
          `Role Anda (${req.user.role}) tidak memiliki akses untuk ${action.toUpperCase()} data pada modul ${resource.toUpperCase()}`,
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
