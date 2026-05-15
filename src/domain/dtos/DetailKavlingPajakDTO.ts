import type { SP3R } from "@prisma/client";

export interface CreateDetailKavlingPajakDTO {
  penjualanId: number;
  notarisId?: number | null;
  biayaNotaris?: number | null;
  lantai?: string | null;
  luasBangunan?: string | null;
  lokasiStrategis?: string | null;
  tanggalAkadPpjb?: string | Date | null;
  akadPpjb?: string | null;
  tanggalAkadAjbPpat?: string | Date | null;
  tanggalPembayaranPph?: string | Date | null;
  tanggalPembayaranBphtb?: string | Date | null;
  pembiayaan?: string | null;
  sp3r?: SP3R | null;
  lebihTanah?: number | null;
  biayaStrategis?: number | null;
  nrBiayaKprAsuransi?: number | null;
  nrDiskonAngsuran?: number | null;
  nrDiskonCash?: number | null;
  nrBiayaBbn?: number | null;
  nrBiayaNotarisAjb?: number | null;
  nrBiayaAppraisal?: number | null;
  nrBiayaBphtb?: number | null;
  nrLainLain?: number | null;
  nrTotalSubsidi?: number | null;
  nrNilaiPenyerahan?: number | null;
  nrPpn?: number | null;
  nrBphtb?: number | null;
  nrPph?: number | null;
  pjBiayaKpr?: number | null;
  pjBiayaAsuransi?: number | null;
  pjDiskonAngsuran?: number | null;
  pjBiayaBbn?: number | null;
  pjBiayaAjb?: number | null;
  pjBiayaAppraisal?: number | null;
  pjBphtb?: number | null;
  pjLainLain?: number | null;
  pjTotalSubsidi?: number | null;
  pjNilaiPenyerahan?: number | null;
  pjPpn?: number | null;
  pjBphtbPajak?: number | null;
  pjPph?: number | null;
  pjTotalBphtbPph?: number | null;
  ajbNjopTanahPerMeter?: number | null;
  ajbNjopTanah?: number | null;
  ajbNjopBangunanPerMeter?: number | null;
  ajbNjopBangunan?: number | null;
  ajbNjopTotal?: number | null;
  ajbPpn?: number | null;
  ajbBphtb?: number | null;
  ajbPph?: number | null;
  ajbTotalBphtbPph?: number | null;
  ajbSelisihPajakPbb?: number | null;
  ajbUping?: number | null;
}

export type UpdateDetailKavlingPajakDTO = Partial<
  Omit<CreateDetailKavlingPajakDTO, "penjualanId">
>;
