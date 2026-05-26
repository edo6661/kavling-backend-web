import type { Role } from "@prisma/client";

export interface MandorProfileEntity {
  namaBank: string;
  noRekening: string;
  atasNamaRekening: string;
}

export interface UserEntity {
  id: number;
  username: string;
  email: string;
  password?: string;
  role: Role;
  mandor?: MandorProfileEntity | null;
  createdAt: Date;
  updatedAt: Date;
}
