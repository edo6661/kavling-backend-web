import type { IUserRepository } from "../../../domain/repositories/IUserRepo.js";
import type { UserResponseDTO } from "../../../domain/dtos/UserDTO.js";
import { AppError } from "../../../domain/errors/AppError.js";
import { StatusCodes } from "http-status-codes";

export class GetProfileUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(userId: number): Promise<UserResponseDTO> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new AppError(StatusCodes.NOT_FOUND, "User tidak ditemukan");
    }
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };
  }
}
