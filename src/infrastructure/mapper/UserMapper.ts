import type { Prisma } from "@prisma/client";
import type { UserEntity } from "../../domain/entities/User";

export class UserMapper {
  static toDomain(
    prismaUser: Prisma.UserGetPayload<{
      include: { mandorProfile: true };
    }>,
  ): UserEntity {
    return {
      id: prismaUser.id,
      username: prismaUser.username,
      email: prismaUser.email,
      password: prismaUser.password,
      role: prismaUser.role,
      mandor: prismaUser.mandorProfile
        ? {
            namaBank: prismaUser.mandorProfile.namaBank,
            noRekening: prismaUser.mandorProfile.noRekening,
            atasNamaRekening: prismaUser.mandorProfile.atasNamaRekening,
          }
        : null,
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt,
    };
  }
}
