import type { Role } from "@prisma/client";
import type { BaseFilterDTO } from "./BaseFilterDTO.js";

export interface UpsertRolePermissionDTO {
  role: Role;
  resource: string;
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

export interface RolePermissionResponseDTO {
  id: number;
  role: Role;
  resource: string;
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RolePermissionFilterDTO extends BaseFilterDTO {
  role?: Role;
  resource?: string;
}
