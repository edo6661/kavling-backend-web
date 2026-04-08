import type { UnitStatus } from "@prisma/client";

export interface UnitEntity {
  id: number;
  namaPerumahan: string;
  blok: string;
  nomorUnit: string;
  tipe: string | null;
  luasTanah: number | null;
  luasBangunan: number | null;
  lantai: number | null;
  lokasiStrategis: string | null;
  status: UnitStatus;
  createdAt: Date;
  updatedAt: Date;
}
