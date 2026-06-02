import type { Prisma } from "@prisma/client";
import type {
  CreatePenjualanDTO,
  PenjualanFilterDTO,
} from "../dtos/PenjualanDTO.js";
import type { OffsetPaginatedData } from "../../types/response.js";

export const penjualanKavlingWithSpkInclude = {
  perumahan: true,
  rekeningTujuan: true,
  sertifikatTanahTambahan: { orderBy: { urutan: "asc" as const } },
  spkItem: {
    include: {
      spk: {
        include: { mandor: { select: { id: true, username: true } } },
      },
    },
  },
} as const;

export type PenjualanWithCompleteRelations = Prisma.PenjualanGetPayload<{
  include: {
    customer: true;
    kavling: {
      include: {
        perumahan: true;
        rekeningTujuan: true;
      };
    };
    rekeningTujuan: true;
    tagihan: true;
    agent: true;
    progressProyek: {
      include: { mandor: { select: { id: true, username: true } } };
    };
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
  dbId: number;
  noTransaksi: string;
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
  kavlingId: number;
  jumlahSertifikatTanah: number;
  sertifikatTanahTambahan?: {
    urutan: number;
    filePbg: string | null;
    fileSertifikatTanah: string | null;
    fileNopPbb: string | null;
  }[];
  filePbg: string | null;
  fileSertifikatTanah: string | null;
  fileNopPbb: string | null;
  luasBangunan: number;
  luasTanah: number;

  plafonAwal: number | null;
  plafonAcc?: number | null;
  biayaKpr?: number | null;
  plafonKredit?: number | null;
  dpTidakDibayar?: number | null;
  dpDibayar?: number | null;
  hargaJual: number | null;
  caraPembayaran: string | null;

  hargaDasar: number;
  dp: number;
  diskonPenjualan: number;
  hargaPromosi: number;
  bank: string;
  bankKprNamaRekening?: string;
  bankKprAtasNamaRekening?: string;
  bankKprNoRekening?: string;
  nilaiPengajuanKpr: number;
  bookingFee: number;
  status: string;
  agent: string;
  fileBuktiBooking: string;
  fileBuktiDp: string;
  fileSpr: string | null;
  ttdData?: any;
  tambahanKpr?: any;
  progressCicilan?: string;
  rekeningTujuanId?: number | null;
  rekeningTujuan?: {
    namaBank: string;
    noRekening: string;
    atasNama: string;
  } | null;
  riwayatGantiKavling?: any[];
  tagihan?: any[];
  progressPenjualan?: any;
  progressProyek?: {
    persentase: number;
    mandorId: number | null;
    mandor: { id: number; username: string } | null;
  } | null;

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
