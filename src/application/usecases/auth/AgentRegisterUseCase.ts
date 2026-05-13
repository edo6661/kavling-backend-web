import type { PrismaClient } from "@prisma/client";
import { Role, AgentStatus, AgentType } from "@prisma/client";
import { hashPassword } from "../../../utils/hashing.js";
import { ConflictError } from "../../../domain/errors/ConflictError.js";
import type { RegisterAgentDTO } from "../../../domain/dtos/AgentDTO.js";

export class RegisterAgentUseCase {
  constructor(private readonly db: PrismaClient) {}

  async execute(data: RegisterAgentDTO) {
    return await this.db.$transaction(async (tx) => {
      const existingUser = await tx.user.findUnique({
        where: { email: data.email },
      });
      if (existingUser)
        throw new ConflictError("Email sudah terdaftar di sistem");

      const existingAgent = await tx.agent.findUnique({
        where: { nik: data.nik },
      });
      if (existingAgent) throw new ConflictError("NIK Agent sudah terdaftar");

      const hashedPassword = await hashPassword(data.password);

      const user = await tx.user.create({
        data: {
          username: data.nama,
          email: data.email,
          password: hashedPassword,
          role: Role.AGENT,
        },
      });

      await tx.agent.create({
        data: {
          userId: user.id,
          nik: data.nik,
          nama: data.nama,
          noHp: data.noHp,
          email: data.email,
          alamat: data.alamat ?? null,
          status: AgentStatus.PENDING,
          type: data.type ?? AgentType.PRIBADI,
          namaBank: data.namaBank ?? null,
          noRekening: data.noRekening ?? null,
          atasNamaRekening: data.atasNamaRekening ?? null,
          perusahaanAgentId: data.perusahaanAgentId ?? null,
          ttdData: data.ttdData ?? null,
        },
      });

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      };
    });
  }
}
