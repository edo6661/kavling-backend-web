import type { Prisma, PrismaClient } from "@prisma/client";
import type { IRolePermissionRepository } from "./IRolePermissionRepo.js";
import type {
  UpsertRolePermissionDTO,
  RolePermissionFilterDTO,
  RolePermissionResponseDTO,
} from "../dtos/RolePermissionDTO.js";
import { NotFoundError } from "../errors/NotFoundError.js";

export class RolePermissionRepository implements IRolePermissionRepository {
  constructor(private readonly db: PrismaClient) {}

  async upsert(
    data: UpsertRolePermissionDTO,
  ): Promise<RolePermissionResponseDTO> {
    const result = await this.db.rolePermission.upsert({
      where: {
        role_resource: {
          role: data.role,
          resource: data.resource.toUpperCase(),
        },
      },
      update: {
        canCreate: data.canCreate,
        canRead: data.canRead,
        canUpdate: data.canUpdate,
        canDelete: data.canDelete,
      },
      create: {
        role: data.role,
        resource: data.resource.toUpperCase(),
        canCreate: data.canCreate,
        canRead: data.canRead,
        canUpdate: data.canUpdate,
        canDelete: data.canDelete,
      },
    });

    return result;
  }

  async findAll(
    filters?: RolePermissionFilterDTO,
  ): Promise<RolePermissionResponseDTO[]> {
    const where: Prisma.RolePermissionWhereInput = {};

    if (filters?.role) where.role = filters.role;
    if (filters?.resource) where.resource = filters.resource.toUpperCase();

    return await this.db.rolePermission.findMany({
      where,
      orderBy: [{ role: "asc" }, { resource: "asc" }],
    });
  }

  async delete(id: number): Promise<void> {
    const existing = await this.db.rolePermission.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Role Permission tidak ditemukan");

    await this.db.rolePermission.delete({ where: { id } });
  }
}
