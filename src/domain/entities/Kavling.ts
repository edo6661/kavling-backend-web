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
  hargaDasar: number;
  status: UnitStatus;
  rekeningTujuanId: number | null;
  rekeningTujuan?:
    | { namaBank: string; noRekening: string; atasNama: string }
    | null
    | undefined;
  filePbg: string | null;
  fileSertifikatTanah: string | null;
  fileNopPbb: string | null;
  penjualan?:
    | { customer?: { nama: string; noHp: string } | null }[]
    | undefined;
  createdAt: Date;
  updatedAt: Date;
}
