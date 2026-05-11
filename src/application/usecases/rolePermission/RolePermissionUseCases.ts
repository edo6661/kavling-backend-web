import type { IRolePermissionRepository } from "../../../domain/repositories/IRolePermissionRepo.js";
import type {
  UpsertRolePermissionDTO,
  RolePermissionFilterDTO,
  RolePermissionResponseDTO,
} from "../../../domain/dtos/RolePermissionDTO.js";

export class UpsertRolePermissionUseCase {
  constructor(private readonly repo: IRolePermissionRepository) {}
  async execute(
    data: UpsertRolePermissionDTO,
  ): Promise<RolePermissionResponseDTO> {
    return await this.repo.upsert(data);
  }
}

export class GetRolePermissionsUseCase {
  constructor(private readonly repo: IRolePermissionRepository) {}
  async execute(
    filters?: RolePermissionFilterDTO,
  ): Promise<RolePermissionResponseDTO[]> {
    return await this.repo.findAll(filters);
  }
}

export class DeleteRolePermissionUseCase {
  constructor(private readonly repo: IRolePermissionRepository) {}
  async execute(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}
