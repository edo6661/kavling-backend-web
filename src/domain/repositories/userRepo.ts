import { Prisma } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";
import type { IUserRepository } from "./IUserRepo";
import type { UserEntity } from "../entities/User";
import type {
  RegisterUserDTO,
  UpdateUserDTO,
  UserFilterDTO,
} from "../dtos/UserDTO";
import { UserMapper } from "../../infrastructure/mapper/UserMapper";
import { ConflictError } from "../errors/ConflictError";
import { NotFoundError } from "../errors/NotFoundError.js";
import type { CursorPaginatedData } from "../../types/response.js";

export class UserRepository implements IUserRepository {
  constructor(private readonly db: PrismaClient) {}
  async findWithCursorPagination(
    limit: number,
    cursor?: number,
    filters?: UserFilterDTO,
  ): Promise<CursorPaginatedData<UserEntity>> {
    const where: Prisma.UserWhereInput = {};

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    if (filters?.search) {
      where.OR = [
        { username: { contains: filters.search } },
        { email: { contains: filters.search } },
      ];
    }
    if (filters?.role) {
      where.role = filters.role;
    }

    let orderByClause: Prisma.UserOrderByWithRelationInput[] = [
      { createdAt: "desc" },
      { id: "asc" },
    ];

    if (filters?.orderBy) {
      const { field, direction } = filters.orderBy;
      const validFields = ["username", "email", "role", "createdAt"];
      if (validFields.includes(field)) {
        orderByClause = [{ [field]: direction }, { id: "asc" }];
      }
    }

    const items = await this.db.user.findMany({
      take: limit + 1,
      ...(cursor && { skip: 1, cursor: { id: cursor } }),
      where,
      orderBy: orderByClause,
    });

    let hasNextPage = false;
    if (items.length > limit) {
      hasNextPage = true;
      items.pop();
    }

    const nextCursor = hasNextPage ? (items.at(-1)?.id ?? null) : null;

    return {
      items: items.map((item) => UserMapper.toDomain(item)),
      meta: { nextCursor, hasNextPage },
    };
  }

  async create(data: RegisterUserDTO): Promise<UserEntity> {
    try {
      const result = await this.db.user.create({
        data: {
          username: data.username,
          email: data.email,
          password: data.password ?? "",
          role: data.role,
        },
      });
      return UserMapper.toDomain(result);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictError("Email sudah terdaftar");
      }
      throw error;
    }
  }

  async update(id: number, data: UpdateUserDTO): Promise<UserEntity> {
    try {
      const existing = await this.db.user.findUnique({ where: { id } });
      if (!existing) throw new NotFoundError("User tidak ditemukan");

      const updateData: Prisma.UserUpdateInput = {};

      if (data.username !== undefined) updateData.username = data.username;
      if (data.email !== undefined) updateData.email = data.email;
      if (data.password !== undefined) updateData.password = data.password;
      if (data.role !== undefined) updateData.role = data.role;

      const result = await this.db.user.update({
        where: { id },
        data: updateData,
      });

      return UserMapper.toDomain(result);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictError("Email sudah digunakan user lain.");
      }
      throw error;
    }
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const result = await this.db.user.findUnique({ where: { email } });
    if (!result) return null;
    return UserMapper.toDomain(result);
  }

  async findById(id: number): Promise<UserEntity | null> {
    const result = await this.db.user.findUnique({ where: { id } });
    if (!result) return null;
    return UserMapper.toDomain(result);
  }

  async findAll(): Promise<UserEntity[]> {
    const results = await this.db.user.findMany({
      orderBy: { createdAt: "desc" },
    });
    return results.map((u) => UserMapper.toDomain(u));
  }
}
