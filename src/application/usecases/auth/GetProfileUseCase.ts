import type { IUserRepository } from "../../../domain/repositories/IUserRepo.js";
import type { UserResponseDTO } from "../../../domain/dtos/UserDTO.js";
import { AppError } from "../../../domain/errors/AppError.js";
import { StatusCodes } from "http-status-codes";
import type { PrismaClient } from "@prisma/client";

export class GetProfileUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly db: PrismaClient,
  ) {}

  async execute(userId: number): Promise<UserResponseDTO> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new AppError(StatusCodes.NOT_FOUND, "User tidak ditemukan");
    }

    const permissions = await this.db.rolePermission.findMany({
      where: { role: user.role },
      select: {
        resource: true,
        canCreate: true,
        canRead: true,
        canUpdate: true,
        canDelete: true,
      },
    });

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      mandor: user.mandor ?? null,
      permissions: permissions,
      createdAt: user.createdAt,
    };
  }
}
