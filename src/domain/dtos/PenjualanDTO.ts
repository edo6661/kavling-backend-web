import type { BaseFilterDTO } from "./BaseFilterDTO.js";
import type { PaymentMethod, PenjualanStatus } from "@prisma/client";
export interface CreatePenjualanDTO {
  noIdentitas: string;
  nama: string;
  noTelepon: string;
  alamat: string;
  perusahaan?: string | undefined;
  alamatKoresponden?: string | undefined;
  perumahan: string;
  blok: string;
  nomorUnit: string;
  tipe: string;
  luasBangunan: number;
  luasTanah: number;
  tanggal: string | Date;
  hargaDasar: number;
  plafonAwal?: number;
  biayaKpr?: number;
  hargaJual?: number;
  hargaPromosi?: number | undefined;
  diskonPenjualan?: number | undefined;
  dp?: number | undefined;
  bookingFee?: number | undefined;
  caraPembayaran: PaymentMethod;
  bank?: string | undefined;
  nilaiPengajuanKpr?: number | undefined;
  agent: string;
  createdBy?: string;
  userId?: number;
  biayaTambahan?: BiayaTambahanDTO[] | undefined;
}
export interface PenjualanResponseDTO {
  id: number;
  noTransaksi: string;
  tanggal: Date;
  customer: {
    id: number;
    nama: string;
  };
  kavling: {
    id: number;
    blok: string;
    nomorUnit: string;
    perumahan: string;
  };
  caraPembayaran: string | null;
  hargaJual: number;
  status: PenjualanStatus;
  createdAt: Date;
}
export type PenjualanFilterDTO = BaseFilterDTO;

export interface BiayaTambahanDTO {
  nama: string;
  nominal: number;
}
