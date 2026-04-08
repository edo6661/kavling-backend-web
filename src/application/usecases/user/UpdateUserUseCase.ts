import type { IUserRepository } from "../../../domain/repositories/IUserRepo";
import type {
  UpdateUserDTO,
  UserResponseDTO,
} from "../../../domain/dtos/UserDTO";
import { hashPassword } from "../../../utils/hashing";

export class UpdateUserUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(id: number, data: UpdateUserDTO): Promise<UserResponseDTO> {
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
      createdAt: updatedUser.createdAt,
    };
  }
}
