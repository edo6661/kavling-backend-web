import type { BaseFilterDTO } from "./BaseFilterDTO.js";
import type { UnitStatus } from "@prisma/client";

export interface CreateUnitDTO {
  namaPerumahan: string;
  blok: string;
  nomorUnit: string;
  tipe?: string | undefined;
  luasTanah?: number | undefined;
  luasBangunan?: number | undefined;
  lantai?: number | undefined;
  lokasiStrategis?: string | undefined;
  status?: UnitStatus | undefined;
}

export interface UpdateUnitDTO {
  namaPerumahan?: string | undefined;
  blok?: string | undefined;
  nomorUnit?: string | undefined;
  tipe?: string | undefined;
  luasTanah?: number | undefined;
  luasBangunan?: number | undefined;
  lantai?: number | undefined;
  lokasiStrategis?: string | undefined;
  status?: UnitStatus | undefined;
}

export interface UnitResponseDTO {
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
}

export interface UnitFilterDTO extends BaseFilterDTO {
  status?: UnitStatus | undefined;
}
