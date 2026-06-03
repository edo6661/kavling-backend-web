import { Role } from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import { AppError } from "../../../domain/errors/AppError.js";
import type { ProgressProyekEntity } from "../../../domain/entities/ProgressProyek.js";

export interface ProgressRequestContext {
  role?: string | undefined;
  userId?: number | undefined;
}

export function isMandorRole(role?: string): boolean {
  return role === Role.MANDOR;
}

/** Mandor efektif: kolom progress, atau mandor SPK jika progress belum punya mandor. */
export function effectiveMandorId(
  progress: ProgressProyekEntity | null,
  spkMandorId?: number | null,
): number | null {
  if (progress?.mandorId) return progress.mandorId;
  return spkMandorId ?? null;
}

export function assertUserIsProjectMandor(
  userId: number,
  progress: ProgressProyekEntity | null,
  spkMandorId?: number | null,
): void {
  if (effectiveMandorId(progress, spkMandorId) !== userId) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "Anda tidak ditugaskan sebagai mandor untuk proyek ini",
    );
  }
}

export function assertAssignedMandor(
  progress: ProgressProyekEntity | null,
  userId: number,
  spkMandorId?: number | null,
): asserts progress is ProgressProyekEntity {
  assertUserIsProjectMandor(userId, progress, spkMandorId);
  if (!progress) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "Anda tidak ditugaskan sebagai mandor untuk proyek ini",
    );
  }
}

export function assertMandorCanMutate(
  progress: ProgressProyekEntity | null,
  ctx?: ProgressRequestContext,
  spkMandorId?: number | null,
): void {
  if (!isMandorRole(ctx?.role)) return;
  if (!ctx?.userId) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "User tidak valid");
  }
  assertUserIsProjectMandor(ctx.userId, progress, spkMandorId);
}
