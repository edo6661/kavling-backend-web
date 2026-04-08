import type { IUserRepository } from "../../../domain/repositories/IUserRepo";
import type { UserResponseDTO } from "../../../domain/dtos/UserDTO";

export class GetAllUsersUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(): Promise<UserResponseDTO[]> {
    const users = await this.userRepo.findAll();

    return users.map((user) => ({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    }));
  }
}
