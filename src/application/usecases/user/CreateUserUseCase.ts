import type { IUserRepository } from "../../../domain/repositories/IUserRepo.js";
import type {
  RegisterUserDTO,
  UserResponseDTO,
} from "../../../domain/dtos/UserDTO.js";
import { hashPassword } from "../../../utils/hashing.js";
import { ConflictError } from "../../../domain/errors/ConflictError.js";
import { Role } from "@prisma/client";
import { AppError } from "../../../domain/errors/AppError.js";
import { StatusCodes } from "http-status-codes";

export class CreateUserUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(data: RegisterUserDTO): Promise<UserResponseDTO> {
    const existingUser = await this.userRepo.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictError("Email sudah terdaftar");
    }
    if (data.role === Role.MANDOR && !data.mandor) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "Data mandor wajib diisi untuk user role MANDOR.",
      );
    }

    const hashedPassword = await hashPassword(data.password ?? "password123");

    const newUser = await this.userRepo.create({
      ...data,
      password: hashedPassword,
    });

    return {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
      mandor: newUser.mandor ?? null,
      createdAt: newUser.createdAt,
    };
  }
}
