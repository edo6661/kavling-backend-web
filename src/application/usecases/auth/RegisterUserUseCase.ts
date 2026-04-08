import type {
  RegisterUserDTO,
  UserResponseDTO,
} from "../../../domain/dtos/UserDTO";
import type { IUserRepository } from "../../../domain/repositories/IUserRepo";
import { hashPassword } from "../../../utils/hashing";
import { ConflictError } from "../../../domain/errors/ConflictError";
import { Role } from "@prisma/client";

export class RegisterUserUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(data: RegisterUserDTO): Promise<UserResponseDTO> {
    if (data.email) {
      const existingUser = await this.userRepo.findByEmail(data.email);
      if (existingUser) {
        throw new ConflictError("Email sudah terdaftar");
      }
    }

    const hashedPassword = await hashPassword(data.password!);
    const roleToAssign = data.role ?? Role.CUSTOMER;

    const newUser = await this.userRepo.create({
      ...data,
      password: hashedPassword,
      role: roleToAssign,
    });

    return {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
      createdAt: newUser.createdAt,
    };
  }
}
