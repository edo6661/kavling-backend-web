import type { Role } from "@prisma/client";

export interface UserEntity {
  id: number;
  username: string;
  email: string;
  password?: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}
