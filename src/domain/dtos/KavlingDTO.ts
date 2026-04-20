import type { BaseFilterDTO } from "./BaseFilterDTO.js";
import type { UnitStatus } from "@prisma/client";
import type { KavlingEntity } from "../entities/Kavling.js";

export interface CreateKavlingDTO {
  perumahanId: number;
  blok: string;
  nomorUnit: string;
  namaTipe: string;
  luasBangunan: number;

  luasTanah: number;
  hargaDasar: number;
  status?: UnitStatus | undefined;
  rekeningTujuanId?: number | undefined;
  filePbg?: string | undefined;
  fileSertifikatTanah?: string | undefined;
  fileNopPbb?: string | undefined;
}

export interface UpdateKavlingDTO {
  perumahanId?: number | undefined;
  blok?: string | undefined;
  nomorUnit?: string | undefined;
  namaTipe?: string | undefined;
  luasBangunan?: number | undefined;
  luasTanah?: number | undefined;
  hargaDasar?: number | undefined;
  status?: UnitStatus | undefined;
  rekeningTujuanId?: number | undefined;
  filePbg?: string | undefined;
  fileSertifikatTanah?: string | undefined;
  fileNopPbb?: string | undefined;
}

export type KavlingResponseDTO = KavlingEntity;

export interface KavlingFilterDTO extends BaseFilterDTO {
  perumahanId?: number | undefined;
  status?: UnitStatus | undefined;
}
