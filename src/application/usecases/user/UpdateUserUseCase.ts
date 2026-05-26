import type { IUserRepository } from "../../../domain/repositories/IUserRepo";
import type {
  UpdateUserDTO,
  UserResponseDTO,
} from "../../../domain/dtos/UserDTO";
import { hashPassword } from "../../../utils/hashing";
import { Role } from "@prisma/client";
import { AppError } from "../../../domain/errors/AppError.js";
import { StatusCodes } from "http-status-codes";
import { NotFoundError } from "../../../domain/errors/NotFoundError.js";

export class UpdateUserUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(id: number, data: UpdateUserDTO): Promise<UserResponseDTO> {
    const existing = await this.userRepo.findById(id);
    if (!existing) {
      throw new NotFoundError("User tidak ditemukan");
    }

    const targetRole = data.role ?? existing.role;
    if (targetRole === Role.MANDOR && !data.mandor && !existing.mandor) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "Data mandor wajib diisi untuk user role MANDOR.",
      );
    }

    const updateData = { ...data };

    if (updateData.password) {
      updateData.password = await hashPassword(updateData.password);
    }

    const updatedUser = await this.userRepo.update(id, updateData);

    return {
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      role: updatedUser.role,
      mandor: updatedUser.mandor ?? null,
      createdAt: updatedUser.createdAt,
    };
  }
}
