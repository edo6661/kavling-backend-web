import type { IAgentRepository } from "../../../domain/repositories/IAgentRepo.js";
import type { IUserRepository } from "../../../domain/repositories/IUserRepo.js";
import { NotFoundError } from "../../../domain/errors/NotFoundError.js";
import { ConflictError } from "../../../domain/errors/ConflictError.js";
import { hashPassword } from "../../../utils/hashing.js";
import { Role } from "@prisma/client";

export class GenerateAgentAccountUseCase {
  constructor(
    private readonly agentRepo: IAgentRepository,
    private readonly userRepo: IUserRepository,
  ) {}

  async execute(agentId: number, passwordInput: string) {
    const agent = await this.agentRepo.findById(agentId);
    if (!agent) throw new NotFoundError("Data Agent tidak ditemukan.");
    if (agent.userId)
      throw new ConflictError(
        "Agent ini sudah memiliki akun portal yang tertaut.",
      );
    if (!agent.email)
      throw new ConflictError(
        "Agent tidak memiliki email. Update profil agent dengan email terlebih dahulu.",
      );

    const existingUser = await this.userRepo.findByEmail(agent.email);
    if (existingUser)
      throw new ConflictError(
        "Email agent ini sudah terdaftar sebagai User di dalam sistem.",
      );

    const hashedPassword = await hashPassword(passwordInput);
    const newUser = await this.userRepo.create({
      username: agent.nama,
      email: agent.email,
      password: hashedPassword,
      role: Role.AGENT,
    });

    await this.agentRepo.update(agentId, { userId: newUser.id });

    return {
      message: "Akun portal agent berhasil dibuat dan ditautkan.",
      akun: {
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
      },
    };
  }
}
