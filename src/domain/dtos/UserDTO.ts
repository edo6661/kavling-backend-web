import type { BaseFilterDTO } from "./BaseFilterDTO.js";
import type { Role } from "@prisma/client";

export interface MandorProfileDTO {
  namaBank: string;
  noRekening: string;
  atasNamaRekening: string;
}

export interface RegisterUserDTO {
  username: string;
  email: string;
  password?: string;
  role: Role;
  mandor?: MandorProfileDTO | undefined;
}

export interface LoginUserDTO {
  email: string;
  password: string;
}

export interface PermissionDTO {
  resource: string;
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}
export interface UserResponseDTO {
  id: number;
  username: string;
  email: string;
  role: Role;
  mandor?: MandorProfileDTO | null | undefined;
  permissions?: PermissionDTO[];
  createdAt: Date;
}

export interface JwtUserPayload {
  userId: number;
  username: string;
  email: string;
  role: Role;
}
export interface LoginResponseDTO {
  token: string;
  user: {
    id: number;
    username: string;
    email: string;
    role: Role;
    permissions?: PermissionDTO[];
  };
}

export interface UpdateUserDTO {
  username?: string | undefined;
  email?: string | undefined;
  password?: string | undefined;
  role?: Role | undefined;
  mandor?: MandorProfileDTO | undefined;
}

export interface UserFilterDTO extends BaseFilterDTO {
  role?: Role;
}
