import type { Prisma } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";
import type { IDetailKavlingPajakRepository } from "./IDetailKavlingPajakRepo.js";
import type {
  CreateDetailKavlingPajakDTO,
  UpdateDetailKavlingPajakDTO,
} from "../dtos/DetailKavlingPajakDTO.js";
import type { DetailKavlingPajakEntity } from "../entities/DetailKavlingPajak.js";
import { DetailKavlingPajakMapper } from "../../infrastructure/mapper/DetailKavlingPajakMapper.js";
import { NotFoundError } from "../errors/NotFoundError.js";
import { ConflictError } from "../errors/ConflictError.js";

export class DetailKavlingPajakRepository implements IDetailKavlingPajakRepository {
  constructor(private readonly db: PrismaClient) {}

  async findByPenjualanId(
    penjualanId: number,
  ): Promise<DetailKavlingPajakEntity | null> {
    const result = await this.db.detailKavlingPajak.findUnique({
      where: { penjualanId },
    });
    if (!result) return null;
    return DetailKavlingPajakMapper.toDomain(result);
  }

  async create(
    data: CreateDetailKavlingPajakDTO,
  ): Promise<DetailKavlingPajakEntity> {
    const existing = await this.findByPenjualanId(data.penjualanId);
    if (existing) {
      throw new ConflictError("Detail Kavling untuk Penjualan ini sudah ada.");
    }

    const parseDate = (d?: string | Date | null) => (d ? new Date(d) : null);

    const createData: Prisma.DetailKavlingPajakUncheckedCreateInput = {
      penjualanId: data.penjualanId,
      notarisId: data.notarisId ?? null,
      lantai: data.lantai ?? null,
      luasBangunan: data.luasBangunan ?? null,
      lokasiStrategis: data.lokasiStrategis ?? null,
      tanggalAkadPpjb: parseDate(data.tanggalAkadPpjb),
      akadPpjb: data.akadPpjb ?? null,
      tanggalAkadAjbPpat: parseDate(data.tanggalAkadAjbPpat),
      tanggalPembayaranPph: parseDate(data.tanggalPembayaranPph),
      tanggalPembayaranBphtb: parseDate(data.tanggalPembayaranBphtb),
      pembiayaan: data.pembiayaan ?? null,
      sp3r: data.sp3r ?? null,
      lebihTanah: data.lebihTanah ?? null,
      biayaStrategis: data.biayaStrategis ?? null,
      nrBiayaKprAsuransi: data.nrBiayaKprAsuransi ?? null,
      nrDiskonAngsuran: data.nrDiskonAngsuran ?? null,
      nrDiskonCash: data.nrDiskonCash ?? null,
      nrBiayaBbn: data.nrBiayaBbn ?? null,
      nrBiayaNotarisAjb: data.nrBiayaNotarisAjb ?? null,
      nrBiayaAppraisal: data.nrBiayaAppraisal ?? null,
      nrBiayaBphtb: data.nrBiayaBphtb ?? null,
      nrLainLain: data.nrLainLain ?? null,
      nrTotalSubsidi: data.nrTotalSubsidi ?? null,
      nrNilaiPenyerahan: data.nrNilaiPenyerahan ?? null,
      nrPpn: data.nrPpn ?? null,
      nrBphtb: data.nrBphtb ?? null,
      nrPph: data.nrPph ?? null,
      pjBiayaKpr: data.pjBiayaKpr ?? null,
      pjBiayaAsuransi: data.pjBiayaAsuransi ?? null,
      pjDiskonAngsuran: data.pjDiskonAngsuran ?? null,
      pjBiayaBbn: data.pjBiayaBbn ?? null,
      pjBiayaAjb: data.pjBiayaAjb ?? null,
      pjBiayaAppraisal: data.pjBiayaAppraisal ?? null,
      pjBphtb: data.pjBphtb ?? null,
      pjLainLain: data.pjLainLain ?? null,
      pjTotalSubsidi: data.pjTotalSubsidi ?? null,
      pjNilaiPenyerahan: data.pjNilaiPenyerahan ?? null,
      pjPpn: data.pjPpn ?? null,
      pjBphtbPajak: data.pjBphtbPajak ?? null,
      pjPph: data.pjPph ?? null,
      pjTotalBphtbPph: data.pjTotalBphtbPph ?? null,
      ajbNjopTanahPerMeter: data.ajbNjopTanahPerMeter ?? null,
      ajbNjopTanah: data.ajbNjopTanah ?? null,
      ajbNjopBangunanPerMeter: data.ajbNjopBangunanPerMeter ?? null,
      ajbNjopBangunan: data.ajbNjopBangunan ?? null,
      ajbNjopTotal: data.ajbNjopTotal ?? null,
      ajbPpn: data.ajbPpn ?? null,
      ajbBphtb: data.ajbBphtb ?? null,
      ajbPph: data.ajbPph ?? null,
      ajbTotalBphtbPph: data.ajbTotalBphtbPph ?? null,
      ajbSelisihPajakPbb: data.ajbSelisihPajakPbb ?? null,
      ajbUping: data.ajbUping ?? null,
    };

    const result = await this.db.detailKavlingPajak.create({
      data: createData,
    });

    return DetailKavlingPajakMapper.toDomain(result);
  }

  async update(
    penjualanId: number,
    data: UpdateDetailKavlingPajakDTO,
  ): Promise<DetailKavlingPajakEntity> {
    const existing = await this.findByPenjualanId(penjualanId);
    if (!existing) {
      throw new NotFoundError(
        "Detail Kavling tidak ditemukan untuk penjualan ini.",
      );
    }

    const parseDate = (d?: string | Date | null) => (d ? new Date(d) : null);
    const updateData: Prisma.DetailKavlingPajakUncheckedUpdateInput = {};

    if (data.notarisId !== undefined)
      updateData.notarisId = data.notarisId ?? null;
    if (data.lantai !== undefined) updateData.lantai = data.lantai ?? null;
    if (data.luasBangunan !== undefined)
      updateData.luasBangunan = data.luasBangunan ?? null;
    if (data.lokasiStrategis !== undefined)
      updateData.lokasiStrategis = data.lokasiStrategis ?? null;
    if (data.tanggalAkadPpjb !== undefined)
      updateData.tanggalAkadPpjb = parseDate(data.tanggalAkadPpjb);
    if (data.akadPpjb !== undefined)
      updateData.akadPpjb = data.akadPpjb ?? null;
    if (data.tanggalAkadAjbPpat !== undefined)
      updateData.tanggalAkadAjbPpat = parseDate(data.tanggalAkadAjbPpat);
    if (data.tanggalPembayaranPph !== undefined)
      updateData.tanggalPembayaranPph = parseDate(data.tanggalPembayaranPph);
    if (data.tanggalPembayaranBphtb !== undefined)
      updateData.tanggalPembayaranBphtb = parseDate(
        data.tanggalPembayaranBphtb,
      );
    if (data.pembiayaan !== undefined)
      updateData.pembiayaan = data.pembiayaan ?? null;
    if (data.sp3r !== undefined) updateData.sp3r = data.sp3r ?? null;
    if (data.lebihTanah !== undefined)
      updateData.lebihTanah = data.lebihTanah ?? null;
    if (data.biayaStrategis !== undefined)
      updateData.biayaStrategis = data.biayaStrategis ?? null;
    if (data.nrBiayaKprAsuransi !== undefined)
      updateData.nrBiayaKprAsuransi = data.nrBiayaKprAsuransi ?? null;
    if (data.nrDiskonAngsuran !== undefined)
      updateData.nrDiskonAngsuran = data.nrDiskonAngsuran ?? null;
    if (data.nrDiskonCash !== undefined)
      updateData.nrDiskonCash = data.nrDiskonCash ?? null;
    if (data.nrBiayaBbn !== undefined)
      updateData.nrBiayaBbn = data.nrBiayaBbn ?? null;
    if (data.nrBiayaNotarisAjb !== undefined)
      updateData.nrBiayaNotarisAjb = data.nrBiayaNotarisAjb ?? null;
    if (data.nrBiayaAppraisal !== undefined)
      updateData.nrBiayaAppraisal = data.nrBiayaAppraisal ?? null;
    if (data.nrBiayaBphtb !== undefined)
      updateData.nrBiayaBphtb = data.nrBiayaBphtb ?? null;
    if (data.nrLainLain !== undefined)
      updateData.nrLainLain = data.nrLainLain ?? null;
    if (data.nrTotalSubsidi !== undefined)
      updateData.nrTotalSubsidi = data.nrTotalSubsidi ?? null;
    if (data.nrNilaiPenyerahan !== undefined)
      updateData.nrNilaiPenyerahan = data.nrNilaiPenyerahan ?? null;
    if (data.nrPpn !== undefined) updateData.nrPpn = data.nrPpn ?? null;
    if (data.nrBphtb !== undefined) updateData.nrBphtb = data.nrBphtb ?? null;
    if (data.nrPph !== undefined) updateData.nrPph = data.nrPph ?? null;
    if (data.pjBiayaKpr !== undefined)
      updateData.pjBiayaKpr = data.pjBiayaKpr ?? null;
    if (data.pjBiayaAsuransi !== undefined)
      updateData.pjBiayaAsuransi = data.pjBiayaAsuransi ?? null;
    if (data.pjDiskonAngsuran !== undefined)
      updateData.pjDiskonAngsuran = data.pjDiskonAngsuran ?? null;
    if (data.pjBiayaBbn !== undefined)
      updateData.pjBiayaBbn = data.pjBiayaBbn ?? null;
    if (data.pjBiayaAjb !== undefined)
      updateData.pjBiayaAjb = data.pjBiayaAjb ?? null;
    if (data.pjBiayaAppraisal !== undefined)
      updateData.pjBiayaAppraisal = data.pjBiayaAppraisal ?? null;
    if (data.pjBphtb !== undefined) updateData.pjBphtb = data.pjBphtb ?? null;
    if (data.pjLainLain !== undefined)
      updateData.pjLainLain = data.pjLainLain ?? null;
    if (data.pjTotalSubsidi !== undefined)
      updateData.pjTotalSubsidi = data.pjTotalSubsidi ?? null;
    if (data.pjNilaiPenyerahan !== undefined)
      updateData.pjNilaiPenyerahan = data.pjNilaiPenyerahan ?? null;
    if (data.pjPpn !== undefined) updateData.pjPpn = data.pjPpn ?? null;
    if (data.pjBphtbPajak !== undefined)
      updateData.pjBphtbPajak = data.pjBphtbPajak ?? null;
    if (data.pjPph !== undefined) updateData.pjPph = data.pjPph ?? null;
    if (data.pjTotalBphtbPph !== undefined)
      updateData.pjTotalBphtbPph = data.pjTotalBphtbPph ?? null;
    if (data.ajbNjopTanahPerMeter !== undefined)
      updateData.ajbNjopTanahPerMeter = data.ajbNjopTanahPerMeter ?? null;
    if (data.ajbNjopTanah !== undefined)
      updateData.ajbNjopTanah = data.ajbNjopTanah ?? null;
    if (data.ajbNjopBangunanPerMeter !== undefined)
      updateData.ajbNjopBangunanPerMeter = data.ajbNjopBangunanPerMeter ?? null;
    if (data.ajbNjopBangunan !== undefined)
      updateData.ajbNjopBangunan = data.ajbNjopBangunan ?? null;
    if (data.ajbNjopTotal !== undefined)
      updateData.ajbNjopTotal = data.ajbNjopTotal ?? null;
    if (data.ajbPpn !== undefined) updateData.ajbPpn = data.ajbPpn ?? null;
    if (data.ajbBphtb !== undefined)
      updateData.ajbBphtb = data.ajbBphtb ?? null;
    if (data.ajbPph !== undefined) updateData.ajbPph = data.ajbPph ?? null;
    if (data.ajbTotalBphtbPph !== undefined)
      updateData.ajbTotalBphtbPph = data.ajbTotalBphtbPph ?? null;
    if (data.ajbSelisihPajakPbb !== undefined)
      updateData.ajbSelisihPajakPbb = data.ajbSelisihPajakPbb ?? null;
    if (data.ajbUping !== undefined)
      updateData.ajbUping = data.ajbUping ?? null;

    const result = await this.db.detailKavlingPajak.update({
      where: { penjualanId },
      data: updateData,
    });

    return DetailKavlingPajakMapper.toDomain(result);
  }
}
