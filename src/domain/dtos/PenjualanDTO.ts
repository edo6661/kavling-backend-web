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
  plafonAwal?: number | undefined;
  biayaKpr?: number | undefined;
  plafonKredit?: number | undefined;
  plafonAcc?: number | undefined;
  dpTidakDibayar?: number | undefined;
  dpDibayar?: number | undefined;
  hargaJual?: number | undefined;
  hargaPromosi?: number | undefined;
  diskonPenjualan?: number | undefined;
  dp?: number | undefined;
  bookingFee?: number | undefined;
  termin?: number | undefined;
  caraPembayaran?: PaymentMethod | undefined;
  bank?: string | undefined;
  nilaiPengajuanKpr?: number | undefined;
  agent: string;
  createdBy?: string | undefined;
  userId?: number | undefined;
  biayaTambahan?: BiayaTambahanDTO[] | undefined;
  biayaTambahanKpr?: BiayaTambahanDTO[] | undefined;
  keteranganUpdateSpr?: string | undefined;
  keteranganAngsuran?: string | undefined;
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
export interface PenjualanFilterDTO extends BaseFilterDTO {
  /** Filter proyek yang ditugaskan ke mandor tertentu */
  mandorUserId?: number;
  /** Kecualikan status tertentu (mis. BATAL di halaman progress) */
  excludeStatus?: string | undefined;
  caraPembayaran?: PaymentMethod | undefined;
}

export interface BiayaTambahanDTO {
  nama: string;
  nominal: number;
}
