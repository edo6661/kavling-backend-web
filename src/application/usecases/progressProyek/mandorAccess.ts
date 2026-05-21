import { Role } from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import { AppError } from "../../../domain/errors/AppError.js";
import type { ProgressProyekEntity } from "../../../domain/entities/ProgressProyek.js";

export interface ProgressRequestContext {
  role?: string;
  userId?: number;
}

export function isMandorRole(role?: string): boolean {
  return role === Role.MANDOR;
}

export function assertAssignedMandor(
  progress: ProgressProyekEntity | null,
  userId: number,
): asserts progress is ProgressProyekEntity {
  if (!progress || progress.mandorId !== userId) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "Anda tidak ditugaskan sebagai mandor untuk proyek ini",
    );
  }
}

export function assertMandorCanMutate(
  progress: ProgressProyekEntity | null,
  ctx?: ProgressRequestContext,
): void {
  if (!isMandorRole(ctx?.role)) return;
  if (!ctx?.userId) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "User tidak valid");
  }
  assertAssignedMandor(progress, ctx.userId);
}
