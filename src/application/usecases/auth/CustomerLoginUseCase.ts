import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import type { IUserRepository } from "../../../domain/repositories/IUserRepo.js";
import { comparePassword } from "../../../utils/hashing.js";
import { AppError } from "../../../domain/errors/AppError.js";
import { env } from "../../../config/env.js";
import { StatusCodes } from "http-status-codes";
import type { PrismaClient } from "@prisma/client";
import type {
  JwtUserPayload,
  LoginUserDTO,
} from "../../../domain/dtos/UserDTO.js";

export class CustomerLoginUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly db: PrismaClient,
  ) {}

  async execute(data: LoginUserDTO) {
    const user = await this.userRepo.findByEmail(data.email);
    const invalidCredentialsError = new AppError(
      StatusCodes.UNAUTHORIZED,
      "Username atau Password salah",
    );

    if (!user?.password) throw invalidCredentialsError;

    const isPasswordValid = await comparePassword(data.password, user.password);
    if (!isPasswordValid) throw invalidCredentialsError;

    const customerProfile = await this.db.customer.findFirst({
      where: { userId: user.id },
    });

    const payload: JwtUserPayload = {
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };

    const jwtOptions: SignOptions = { expiresIn: "7d" };
    const token = jwt.sign(payload, env.JWT_SECRET, jwtOptions);

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      customerProfile: customerProfile
        ? {
            id: customerProfile.id,
            nama: customerProfile.nama,
            nikKtp: customerProfile.nikKtp,
          }
        : null,
    };
  }
}
