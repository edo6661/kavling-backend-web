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

export class AgentLoginUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly db: PrismaClient,
  ) {}

  async execute(data: LoginUserDTO) {
    const user = await this.userRepo.findByEmail(data.email);
    const invalidCredentialsError = new AppError(
      StatusCodes.UNAUTHORIZED,
      "Email atau Password salah",
    );

    if (!user?.password || user.role !== "AGENT") {
      throw invalidCredentialsError;
    }

    const isPasswordValid = await comparePassword(data.password, user.password);
    if (!isPasswordValid) {
      throw invalidCredentialsError;
    }

    const agentProfile = await this.db.agent.findFirst({
      where: { userId: user.id },
    });

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
        permissions,
      },
      agentProfile: agentProfile
        ? {
            id: agentProfile.id,
            nama: agentProfile.nama,
            nik: agentProfile.nik,
            type: agentProfile.type,
          }
        : null,
    };
  }
}
