import type { Role } from "@prisma/client";

import type { MandorRekeningSnapshot } from "../mandor/mandorRekening.js";

export interface MandorProfileEntity {
  namaBank: string;
  noRekening: string;
  atasNamaRekening: string;
  rekeningList?: MandorRekeningSnapshot[];
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
