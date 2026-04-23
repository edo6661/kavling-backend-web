import type { Prisma } from "@prisma/client";
import type {
  CreatePenjualanDTO,
  PenjualanFilterDTO,
} from "../dtos/PenjualanDTO.js";
import type { OffsetPaginatedData } from "../../types/response.js";

export type PenjualanWithCompleteRelations = Prisma.PenjualanGetPayload<{
  include: {
    customer: true;
    kavling: {
      include: { perumahan: true; rekeningTujuan: true }; // <--- Menambahkan relasi rekeningTujuan di sini
    };
    rekeningTujuan: true;
    tagihan: true;
    agent: true;
  };
}>;

export type PenjualanWithRelations = Prisma.PenjualanGetPayload<{
  include: {
    customer: { select: { id: true; nama: true } };
    kavling: {
      select: {
        id: true;
        blok: true;
        nomorUnit: true;
        perumahan: { select: { nama: true } };
      };
    };
  };
}>;
export interface PenjualanPaginatedItem {
  id: string;
  tanggal: string;
  nama: string;
  alamat: string;
  noTelepon: string;
  noIdentitas: string;
  perumahan: string;
  blok: string;
  alasanBatal: string | null;
  nomorUnit: string;
  tipe: string;
  luasBangunan: number;
  luasTanah: number;

  plafonAwal: number | null;
  hargaJual: number | null;
  caraPembayaran: string | null;

  hargaDasar: number;
  dp: number;
  diskonPenjualan: number;
  hargaPromosi: number;
  bank: string;
  nilaiPengajuanKpr: number;
  bookingFee: number;
  status: string;
  agent: string;
  fileBuktiBooking: string;
  fileBuktiDp: string;
  fileSpr: string | null;
  ttdData?: any;
  progressCicilan?: string;
  rekeningTujuanId?: number | null;
  rekeningTujuan?: {
    namaBank: string;
    noRekening: string;
    atasNama: string;
  } | null;
  riwayatGantiKavling?: any[];
  tagihan?: any[];

  createdBy?: string;
  isPendingBatal?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface IPenjualanRepository {
  createWithTransaction(
    data: CreatePenjualanDTO,
  ): Promise<PenjualanWithRelations>;
  findWithOffsetPagination(
    page: number,
    limit: number,
    filters?: PenjualanFilterDTO & { status?: string },
  ): Promise<OffsetPaginatedData<PenjualanPaginatedItem>>;

  findById(id: number): Promise<PenjualanWithCompleteRelations | null>;
  update(
    id: number,
    data: Partial<Prisma.PenjualanUpdateInput>,
  ): Promise<PenjualanWithCompleteRelations>;
}
