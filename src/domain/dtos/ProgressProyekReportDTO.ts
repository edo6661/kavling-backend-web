export interface ProgressProyekReportFilterDTO {
  perumahanId?: number;
  spkId?: number;
  blok?: string;
  mandorId?: number;
  startDate?: string;
  endDate?: string;
}

export interface ProgressProyekTahapanDTO {
  id: number;
  namaTahapan: string;
  kategori?: string | null;
  persentase: number;
  deskripsi: string | null;
  tanggal: string;
  reportedBy: string | null;
}

export interface ProgressProyekUnitItemDTO {
  kavlingId: number;
  blok: string;
  nomorUnit: string;
  perumahanId: number;
  perumahanNama: string;
  customerNama: string;
  penjualanStatus: string;
  spkId: number | null;
  noSpk: string | null;
  judulPekerjaan: string | null;
  mandor: { id: number; username: string } | null;
  progress: number;
  tahapTerakhir: string;
  isLate: boolean;
  jumlahTahapan: number;
  tahapan: ProgressProyekTahapanDTO[];
}

export interface ProgressProyekBlokRowDTO {
  blok: string;
  totalUnit: number;
  rataRataProgress: number;
  selesai: number;
  proses: number;
  belumMulai: number;
}

export interface ProgressProyekSpkRowDTO {
  spkId: number;
  noSpk: string;
  judulPekerjaan: string;
  mandor: { id: number; username: string };
  totalUnit: number;
  rataRataProgress: number;
  selesai: number;
  proses: number;
}

export interface ProgressProyekReportSummaryDTO {
  totalUnit: number;
  rataRataProgress: number;
  unitSelesai: number;
  unitProses: number;
  unitBelumMulai: number;
  unitTerlambat: number;
}

export interface ProgressProyekInfraItemDTO {
  spkId: number;
  noSpk: string;
  judulPekerjaan: string;
  zonaNama: string | null;
  mandor: { id: number; username: string };
  progress: number;
  jumlahPekerjaan: number;
  pekerjaanSelesai: number;
  tahapTerakhir: string;
  isLate: boolean;
  jatuhTempo: string | null;
  tahapan: ProgressProyekTahapanDTO[];
}

export interface ProgressProyekInfraSummaryDTO {
  totalSpk: number;
  rataRataProgress: number;
  spkSelesai: number;
  spkProses: number;
  spkBelumMulai: number;
  spkTerlambat: number;
}

export interface ProgressProyekReportDTO {
  filters: ProgressProyekReportFilterDTO;
  summary: ProgressProyekReportSummaryDTO;
  byBlok: ProgressProyekBlokRowDTO[];
  bySpk: ProgressProyekSpkRowDTO[];
  items: ProgressProyekUnitItemDTO[];
  infraSummary: ProgressProyekInfraSummaryDTO;
  infraItems: ProgressProyekInfraItemDTO[];
}
