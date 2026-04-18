import type { BaseFilterDTO } from "./BaseFilterDTO.js";
import type { PaymentMethod, PenjualanStatus } from "@prisma/client";

export interface CreatePenjualanDTO {
  // --- Data Customer ---
  noIdentitas: string;
  nama: string;
  noTelepon: string;
  alamat: string;
  perusahaan?: string | undefined;
  alamatKoresponden?: string | undefined;

  // --- Data Kavling & Perumahan ---
  perumahan: string;
  blok: string;
  nomorUnit: string;
  tipe: string;
  luasBangunan: number;
  luasTanah: number;

  // --- Data Penjualan ---
  tanggal: string | Date;
  hargaJual: number;
  hargaPromosi?: number | undefined;
  diskonPenjualan?: number | undefined;
  dp?: number | undefined;
  bookingFee?: number | undefined;
  caraPembayaran: PaymentMethod;
  bank?: string | undefined;
  nilaiPengajuanKpr?: number | undefined;

  // --- Data Agent ---
  agent: string;
  createdBy?: string;
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
  caraPembayaran: string;
  hargaJual: number;
  status: PenjualanStatus;
  createdAt: Date;
}

export type PenjualanFilterDTO = BaseFilterDTO;
