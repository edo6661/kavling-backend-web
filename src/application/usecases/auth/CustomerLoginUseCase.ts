import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import type { IUserRepository } from "../../../domain/repositories/IUserRepo.js";
import { comparePassword } from "../../../utils/hashing.js";
import { AppError } from "../../../domain/errors/AppError.js";
import { env } from "../../../config/env.js";
import { StatusCodes } from "http-status-codes";
import type { PrismaClient } from "@prisma/client";
import type { JwtUserPayload } from "../../../domain/dtos/UserDTO.js";

interface CustomerLoginInput {
  username: string;
  password: string;
}
export class CustomerLoginUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly db: PrismaClient,
  ) {}

  async execute(data: CustomerLoginInput) {
    const user = await this.db.user.findFirst({
      where: {
        role: "CUSTOMER",
        OR: [
          { username: data.username },
          { customers: { some: { noHp: data.username } } },
        ],
      },
    });

    const invalidCredentialsError = new AppError(
      StatusCodes.UNAUTHORIZED,
      "Username (No. HP) atau Password (NIK) salah",
    );

    if (!user) throw invalidCredentialsError;

    const customerProfile = await this.db.customer.findFirst({
      where: { userId: user.id },
    });

    const isPasswordValid = user.password
      ? await comparePassword(data.password, user.password)
      : false;

    const isNikValid = customerProfile
      ? data.password === customerProfile.nikKtp
      : false;

    if (!isPasswordValid && !isNikValid) {
      throw invalidCredentialsError;
    }

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
