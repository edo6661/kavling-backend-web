import type { User as PrismaUser } from "@prisma/client";
import type { UserEntity } from "../../domain/entities/User";

export class UserMapper {
  static toDomain(prismaUser: PrismaUser): UserEntity {
    return {
      id: prismaUser.id,
      username: prismaUser.username,
      email: prismaUser.email,
      password: prismaUser.password,
      role: prismaUser.role,
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt,
    };
  }
}
