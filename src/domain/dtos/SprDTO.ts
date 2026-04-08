import type { BaseFilterDTO } from "./BaseFilterDTO.js";
import type {
  SprStatus,
  CaraPembayaran,
  StatusAkadPpjb,
  Sp3r,
} from "@prisma/client";
import type { SprPaymentResponseDTO } from "./SprPaymentDTO.js";

export interface CreateSprDTO {
  customerId: number;
  unitId: number;
  marketingUserId: number;
  bankRekeningPtId: number;
  hargaJual: number;
  diskonPenjualan?: number | undefined;
  paketPromosi?: string | undefined;
  caraPembayaran: CaraPembayaran;
  nilaiPengajuanKpr?: number | undefined;
  bankKpr?: string | undefined;
  bookingFee?: number | undefined;
  closingFee?: number | undefined;
  marketingFee?: number | undefined;
  agent?: string | undefined;
}

export interface UpdateSprDTO {
  hargaJual?: number | undefined;
  diskonPenjualan?: number | undefined;
  paketPromosi?: string | undefined;
  caraPembayaran?: CaraPembayaran | undefined;
  nilaiPengajuanKpr?: number | undefined;
  bankKpr?: string | undefined;
  status?: SprStatus | undefined;
  ttdPemesan?: string | undefined;
  tanggalTtdPemesan?: Date | undefined;
  ttdMarketing?: string | undefined;
  tanggalTtdMarketing?: Date | undefined;
  ttdSupervisor?: string | undefined;
  tanggalTtdSupervisor?: Date | undefined;
  ttdManager?: string | undefined;
  tanggalTtdManager?: Date | undefined;
  ttdSalesAdmin?: string | undefined;
  tanggalTtdSalesAdmin?: Date | undefined;
  agent?: string | undefined;
}
export interface SprResponseDTO {
  id: number;
  nomorSpr: string;
  customerId: number;
  unitId: number;
  marketingUserId: number;
  bankRekeningPtId: number;
  hargaJual: number;
  diskonPenjualan: number | null;
  paketPromosi: string | null;
  caraPembayaran: CaraPembayaran;
  nilaiPengajuanKpr: number | null;
  bankKpr: string | null;
  status: SprStatus;
  ttdPemesan: string | null;
  tanggalTtdPemesan: Date | null;
  ttdMarketing: string | null;
  tanggalTtdMarketing: Date | null;
  ttdSupervisor: string | null;
  tanggalTtdSupervisor: Date | null;
  ttdManager: string | null;
  tanggalTtdManager: Date | null;
  ttdSalesAdmin: string | null;
  tanggalTtdSalesAdmin: Date | null;
  alasanBatal: string | null;
  agent: string | undefined | null;
  payments?: SprPaymentResponseDTO[];
  createdAt: Date;
}

export interface SprFilterDTO extends BaseFilterDTO {
  status?: SprStatus | undefined;
  caraPembayaran?: CaraPembayaran | undefined;
  customerId?: number | undefined;
  unitId?: number | undefined;
}
export interface FastEntrySprDTO {
  nikKtp: string;
  nama: string;
  noHp: string;
  email?: string | undefined;
  pekerjaan?: string | undefined;
  perusahaan?: string | undefined;
  alamatKorespondensi?: string | undefined;
  alamatKtp: string;
  alamatTinggal?: string | undefined;

  unitId: number;
  bankRekeningPtId: number;
  marketingUserId?: number | undefined;

  hargaJual: number;
  caraPembayaran: CaraPembayaran;
  bankKpr?: string | undefined;
  agent?: string | undefined;

  statusAkadPpjb?: StatusAkadPpjb | undefined;
  tanggalAkadPpjb?: Date | undefined;
  tanggalAkadAjbPpat?: Date | undefined;
  tanggalPembayaranPph?: Date | undefined;
  tanggalPembayaranBphtb?: Date | undefined;
  pembiayaan?: string | undefined;
  sp3r?: Sp3r | undefined;

  hargaLebihTanah?: number | undefined;
  biayaStrategis?: number | undefined;
  biayaKpr?: number | undefined;
  biayaAsuransi?: number | undefined;
  diskonAngsuran?: number | undefined;
  diskonCashKeras?: number | undefined;
  diskonLainnya?: number | undefined;
  biayaBalikNama?: number | undefined;
  biayaNotarisAjb?: number | undefined;
  biayaAppraisal?: number | undefined;
  biayaBphtb?: number | undefined;
  biayaLainLain?: number | undefined;
  ppn?: number | undefined;
  pph?: number | undefined;
  njopTanahPerMeter?: number | undefined;
  njopBangunanPerMeter?: number | undefined;
  uping?: number | undefined;

  bookingFee?: number | undefined;
  tanggalTransferBookingFee?: Date | undefined;
  closingFee?: number | undefined;
  tanggalTransferClosingFee?: Date | undefined;
  marketingFee?: number | undefined;
  tanggalTransferMarketingFee?: Date | undefined;
}
export interface FastEntrySprFiles {
  fileKtp?: Buffer | undefined;
  fileKk?: Buffer | undefined;
  fileNpwp?: Buffer | undefined;
  buktiTransferBookingFee?: Buffer | undefined;
  buktiTransferClosingFee?: Buffer | undefined;
  buktiTransferMarketingFee?: Buffer | undefined;
}
