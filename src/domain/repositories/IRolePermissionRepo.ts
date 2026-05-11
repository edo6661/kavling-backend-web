import type {
  UpsertRolePermissionDTO,
  RolePermissionFilterDTO,
  RolePermissionResponseDTO,
} from "../dtos/RolePermissionDTO.js";

export interface IRolePermissionRepository {
  upsert(data: UpsertRolePermissionDTO): Promise<RolePermissionResponseDTO>;
  findAll(
    filters?: RolePermissionFilterDTO,
  ): Promise<RolePermissionResponseDTO[]>;
  delete(id: number): Promise<void>;
}
