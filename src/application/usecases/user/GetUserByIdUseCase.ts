import type { IUserRepository } from "../../../domain/repositories/IUserRepo.js";
import type { UserResponseDTO } from "../../../domain/dtos/UserDTO.js";
import { NotFoundError } from "../../../domain/errors/NotFoundError.js";

export class GetUserByIdUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(id: number): Promise<UserResponseDTO> {
    const user = await this.userRepo.findById(id);
    if (!user) {
      throw new NotFoundError("User tidak ditemukan");
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
