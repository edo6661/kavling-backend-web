import type { SpkPembayaranJenis, SpkPembayaranStatus } from "@prisma/client";

export interface BiayaProyekReportFilterDTO {
  perumahanId?: number;
  spkId?: number;
  blok?: string;
  startDate?: string;
  endDate?: string;
  pembayaranStatus?: SpkPembayaranStatus | "ALL";
}

export interface BiayaProyekKavlingUnitDTO {
  kavlingId: number;
  blok: string;
  nomorUnit: string;
  perumahanId: number;
  perumahanNama: string;
}

export interface BiayaProyekKasbonBarisDTO {
  id: number;
  namaSupplier: string;
  keterangan: string | null;
  tanggalPo: string;
  nominal: number;
}

export interface BiayaProyekUpahBarisDTO {
  id: number;
  nik: string;
  nama: string;
  nominal: number;
}

export interface BiayaProyekPembayaranDTO {
  id: number;
  jenis: SpkPembayaranJenis;
  jenisLabel: string;
  nominal: number;
  status: SpkPembayaranStatus;
  keterangan: string | null;
  tanggalPembayaran: string | null;
  tanggalPo: string | null;
  tanggalDari: string | null;
  tanggalSampai: string | null;
  kasbonBaris: BiayaProyekKasbonBarisDTO[];
  upahBaris: BiayaProyekUpahBarisDTO[];
}

export interface BiayaProyekSpkItemDTO {
  spkId: number;
  noSpk: string;
  judulPekerjaan: string;
  nilaiKontrak: number;
  nilaiSudahDibayarkan: number;
  sisaNilaiKontrak: number;
  mandor: { id: number; username: string };
  kavlingUnits: BiayaProyekKavlingUnitDTO[];
  pembayaran: BiayaProyekPembayaranDTO[];
  totalPembayaran: number;
  totalKasbon: number;
  totalUpah: number;
}

export interface BiayaProyekSupplierRowDTO {
  namaSupplier: string;
  jumlahTransaksi: number;
  totalNominal: number;
}

export interface BiayaProyekTukangRowDTO {
  nik: string;
  nama: string;
  jumlahTransaksi: number;
  totalNominal: number;
}

export interface BiayaProyekByJenisDTO {
  TERMIN_55: number;
  TERMIN_100: number;
  RETENSI: number;
  KASBON: number;
  UPAH: number;
}

export interface BiayaProyekReportSummaryDTO {
  jumlahSpk: number;
  totalNilaiKontrak: number;
  totalSudahDibayar: number;
  totalSisa: number;
  byJenis: BiayaProyekByJenisDTO;
  totalKasbon: number;
  totalUpah: number;
}

export interface BiayaProyekReportDTO {
  filters: BiayaProyekReportFilterDTO;
  summary: BiayaProyekReportSummaryDTO;
  items: BiayaProyekSpkItemDTO[];
  bySupplier: BiayaProyekSupplierRowDTO[];
  byTukang: BiayaProyekTukangRowDTO[];
}
