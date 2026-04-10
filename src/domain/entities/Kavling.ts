import type { UnitStatus } from "@prisma/client";

export interface KavlingEntity {
  id: number;
  perumahanId: number;
  perumahan?: { id: number; nama: string } | undefined;
  blok: string;
  nomorUnit: string;
  namaTipe: string;
  luasBangunan: number;
  luasTanah: number;
  hargaJual: number;
  status: UnitStatus;
  rekeningTujuanId: number | null;
  rekeningTujuan?:
    | { namaBank: string; noRekening: string; atasNama: string }
    | null
    | undefined;
  filePbg: string | null;
  fileSertifikatTanah: string | null;
  fileNopPbb: string | null;
  createdAt: Date;
  updatedAt: Date;
}
