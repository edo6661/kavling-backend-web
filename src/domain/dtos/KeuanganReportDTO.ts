export type KeuanganKategoriFilter = "ALL" | "SPK" | "NOTARIS" | "KPR" | "MASUK";
export type KeuanganBsiCmsFilter = "ALL" | "SUDAH" | "BELUM";

export interface KeuanganReportFilterDTO {
  startDate?: string;
  endDate?: string;
  kategori?: KeuanganKategoriFilter;
  bsiCms?: KeuanganBsiCmsFilter;
  status?: "ALL" | "SUDAH_DIBAYAR" | "MENUNGGU_PEMBAYARAN";
}

export interface KeuanganArusKasBulanDTO {
  bulan: string;
  bulanLabel: string;
  masuk: number;
  keluar: number;
}

export interface KeuanganKategoriRowDTO {
  kategori: string;
  label: string;
  sudahDibayar: number;
  menungguPembayaran: number;
  bsiBelumDilaporkan: number;
}

export interface KeuanganPengeluaranItemDTO {
  id: number;
  kategori: "SPK" | "NOTARIS" | "KPR";
  jenis: string;
  jenisLabel: string;
  nominal: number;
  status: string;
  tanggalPembayaran: string | null;
  bsiCmsDilaporkan: boolean;
  referensi: string;
  sublabel: string | null;
}

export interface KeuanganPemasukanItemDTO {
  id: number;
  kategori: "TAGIHAN";
  noTagihan: string;
  nominal: number;
  tujuan: string;
  tujuanLabel: string;
  tanggalLunas: string;
  customerNama: string;
  kavlingLabel: string;
}

export interface KeuanganReportSummaryDTO {
  totalMasuk: number;
  totalKeluar: number;
  totalMenungguKeluar: number;
  spkKeluar: number;
  notarisKeluar: number;
  kprKeluar: number;
  bsiCmsSudahDilaporkan: number;
  bsiCmsBelumDilaporkan: number;
  arusKasBersih: number;
}

export interface KeuanganReportDTO {
  filters: KeuanganReportFilterDTO;
  summary: KeuanganReportSummaryDTO;
  arusKasBulanan: KeuanganArusKasBulanDTO[];
  byKategori: KeuanganKategoriRowDTO[];
  pengeluaran: KeuanganPengeluaranItemDTO[];
  pemasukan: KeuanganPemasukanItemDTO[];
}
