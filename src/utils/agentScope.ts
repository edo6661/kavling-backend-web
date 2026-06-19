import { Role } from "@prisma/client";
import type { Request } from "express";
import { StatusCodes } from "http-status-codes";
import { prisma } from "../infrastructure/database/prisma.js";
import { AppError } from "../domain/errors/AppError.js";

export async function resolveAgentIdForUser(userId: number): Promise<number> {
  const agent = await prisma.agent.findFirst({ where: { userId } });
  if (!agent) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "Profil agent tidak ditemukan untuk akun ini",
    );
  }
  return agent.id;
}

export async function resolveAgentNameForUser(userId: number): Promise<string> {
  const agentId = await resolveAgentIdForUser(userId);
  const agent = await prisma.agent.findUnique({ where: { id: agentId } });
  if (!agent) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "Profil agent tidak ditemukan untuk akun ini",
    );
  }
  return agent.nama;
}

export async function assertAgentOwnsCustomer(
  agentId: number,
  customerId: number,
): Promise<void> {
  const link = await prisma.penjualan.findFirst({
    where: { agentId, customerId },
  });
  if (!link) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "Anda tidak memiliki akses ke customer ini",
    );
  }
}

export async function resolveAgentIdFilter(
  req: Request,
): Promise<number | undefined> {
  if (req.user?.role !== Role.AGENT || !req.user.userId) {
    return undefined;
  }
  return resolveAgentIdForUser(req.user.userId);
}
