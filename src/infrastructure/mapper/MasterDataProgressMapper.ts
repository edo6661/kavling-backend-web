import type { MasterDataProgress as PrismaMasterDataProgress } from "@prisma/client";
import type {
  MasterDataProgressEntity,
  KalkulasiProgress,
} from "../../domain/entities/MasterDataProgress.js";
import { Prisma } from "@prisma/client";

type MasterDataProgressWithRelations = PrismaMasterDataProgress & {
  spr?: {
    hargaJual: any;
    unit?: {
      luasTanah: number | null;
      luasBangunan: number | null;
      lantai: number | null;
    } | null;
  } | null;
};

export class MasterDataProgressMapper {
  private static toNumberSafe(
    val: Prisma.Decimal | number | null | undefined,
  ): number | null {
    if (val === null || val === undefined) return null;
    if (Prisma.Decimal.isDecimal(val)) return val.toNumber();
    if (typeof val === "number") return val;
    return Number(val);
  }
  private static hitungKalkulasi(
    prismaData: MasterDataProgressWithRelations,
  ): KalkulasiProgress {
    const hargaJualSpr = prismaData.spr?.hargaJual
      ? Number(prismaData.spr.hargaJual)
      : 0;
    const luasTanah = prismaData.spr?.unit?.luasTanah ?? 0;
    const luasBangunan = prismaData.spr?.unit?.luasBangunan ?? 0;
    const lantai = prismaData.spr?.unit?.lantai ?? 1;

    const hargaLebihTanah = this.toNumberSafe(prismaData.hargaLebihTanah) ?? 0;
    const biayaStrategis = this.toNumberSafe(prismaData.biayaStrategis) ?? 0;
    const totalHargaJual = hargaJualSpr + hargaLebihTanah + biayaStrategis;

    const biayaKpr = this.toNumberSafe(prismaData.biayaKpr) ?? 0;
    const biayaAsuransi = this.toNumberSafe(prismaData.biayaAsuransi) ?? 0;
    const diskonAngsuran = this.toNumberSafe(prismaData.diskonAngsuran) ?? 0;
    const diskonCashKeras = this.toNumberSafe(prismaData.diskonCashKeras) ?? 0;
    const diskonLainnya = this.toNumberSafe(prismaData.diskonLainnya) ?? 0;
    const biayaBalikNama = this.toNumberSafe(prismaData.biayaBalikNama) ?? 0;
    const biayaNotarisAjb = this.toNumberSafe(prismaData.biayaNotarisAjb) ?? 0;
    const biayaAppraisal = this.toNumberSafe(prismaData.biayaAppraisal) ?? 0;
    const biayaLainLain = this.toNumberSafe(prismaData.biayaLainLain) ?? 0;
    const biayaBphtb = this.toNumberSafe(prismaData.biayaBphtb) ?? 0;

    const totalNilaiRumah =
      biayaKpr +
      biayaAsuransi +
      diskonAngsuran +
      diskonCashKeras +
      diskonLainnya +
      biayaBalikNama +
      biayaNotarisAjb +
      biayaAppraisal +
      biayaLainLain +
      biayaBphtb;

    const totalSubsidiBonus =
      biayaKpr +
      biayaAsuransi +
      diskonAngsuran +
      biayaBalikNama +
      biayaNotarisAjb +
      biayaAppraisal +
      biayaBphtb +
      biayaLainLain;

    const nilaiPenyerahan = totalHargaJual - totalSubsidiBonus;

    const ppnSubsidiBonus = nilaiPenyerahan * 0.11;
    const bphtbSubsidiBonus = Math.max(0, nilaiPenyerahan - 80000000) * 0.05;
    const pphSubsidiBonus = nilaiPenyerahan * 0.05;
    const totalBphtbPphSubsidi = bphtbSubsidiBonus + pphSubsidiBonus;

    const njopTanahPerMeter =
      this.toNumberSafe(prismaData.njopTanahPerMeter) ?? 0;
    const njopBangunanPerMeter =
      this.toNumberSafe(prismaData.njopBangunanPerMeter) ?? 0;

    const njopTanahTotal = njopTanahPerMeter * luasTanah;
    const njopBangunanTotal = njopBangunanPerMeter * luasBangunan;
    const njopTotal = njopTanahTotal + njopBangunanTotal;

    const ppnNjop = njopTotal * 0.11;
    const bphtbNjop = Math.max(0, njopTotal - 80000000) * 0.05;
    const pphNjop = njopTotal * 0.05;
    const totalBphtbPphNjop = bphtbNjop + pphNjop;

    const selisihPajakPbb = totalBphtbPphSubsidi + totalBphtbPphNjop;

    const pengaliUping = lantai === 2 ? 1.1 : 1.0;
    const baseUping = njopTotal * pengaliUping;
    const upingKalkulasi = Math.ceil(baseUping / 10000) * 10000;

    return {
      totalHargaJual,
      totalNilaiRumah,
      totalSubsidiBonus,
      nilaiPenyerahan,
      ppnSubsidiBonus,
      bphtbSubsidiBonus,
      pphSubsidiBonus,
      totalBphtbPphSubsidi,
      njopTanahTotal,
      njopBangunanTotal,
      njopTotal,
      ppnNjop,
      bphtbNjop,
      pphNjop,
      totalBphtbPphNjop,
      selisihPajakPbb,
      upingKalkulasi,
    };
  }

  static toDomain(
    prismaData: MasterDataProgressWithRelations,
  ): MasterDataProgressEntity {
    const kalkulasi = this.hitungKalkulasi(prismaData);

    return {
      id: prismaData.id,
      sprId: prismaData.sprId,

      tanggalAkadPpjb: prismaData.tanggalAkadPpjb,
      statusAkadPpjb: prismaData.statusAkadPpjb,
      tanggalAkadAjbPpat: prismaData.tanggalAkadAjbPpat,
      tanggalPembayaranPph: prismaData.tanggalPembayaranPph,
      tanggalPembayaranBphtb: prismaData.tanggalPembayaranBphtb,

      pembiayaan: prismaData.pembiayaan,
      sp3r: prismaData.sp3r,

      hargaLebihTanah: this.toNumberSafe(prismaData.hargaLebihTanah),
      biayaStrategis: this.toNumberSafe(prismaData.biayaStrategis),
      biayaKpr: this.toNumberSafe(prismaData.biayaKpr),
      biayaAsuransi: this.toNumberSafe(prismaData.biayaAsuransi),
      diskonAngsuran: this.toNumberSafe(prismaData.diskonAngsuran),
      diskonCashKeras: this.toNumberSafe(prismaData.diskonCashKeras),
      diskonLainnya: this.toNumberSafe(prismaData.diskonLainnya),
      biayaBalikNama: this.toNumberSafe(prismaData.biayaBalikNama),
      biayaNotarisAjb: this.toNumberSafe(prismaData.biayaNotarisAjb),
      biayaAppraisal: this.toNumberSafe(prismaData.biayaAppraisal),
      biayaBphtb: this.toNumberSafe(prismaData.biayaBphtb),
      biayaLainLain: this.toNumberSafe(prismaData.biayaLainLain),
      ppn: this.toNumberSafe(prismaData.ppn),
      pph: this.toNumberSafe(prismaData.pph),

      njopTanahPerMeter: this.toNumberSafe(prismaData.njopTanahPerMeter),
      njopBangunanPerMeter: this.toNumberSafe(prismaData.njopBangunanPerMeter),
      uping: this.toNumberSafe(prismaData.uping),

      kalkulasi: kalkulasi,

      createdAt: prismaData.createdAt,
      updatedAt: prismaData.updatedAt,
    };
  }
}
