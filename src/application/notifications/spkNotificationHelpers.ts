import type { SpkPembayaranJenis } from "@prisma/client";
import type { SpkEntity } from "../../domain/entities/Spk.js";
import type { SpkPembayaranEntity } from "../../domain/entities/SpkPembayaran.js";
import type { NotificationPayload } from "../../infrastructure/notifications/NotificationService.js";

const JENIS_LABEL: Record<SpkPembayaranJenis, string> = {
  TERMIN_55: "Termin 55%",
  TERMIN_100: "Termin 100%",
  TERMIN_INFRA_20_1: "Termin 20% (1)",
  TERMIN_INFRA_20_2: "Termin 20% (2)",
  TERMIN_INFRA_20_3: "Termin 20% (3)",
  TERMIN_INFRA_20_4: "Termin 20% (4)",
  TERMIN_INFRA_15: "Termin 15%",
  RETENSI: "Retensi",
  KASBON: "Kasbon",
  UPAH: "Upah Tukang",
};

const formatRupiah = (value: number): string =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

export function buildSpkPengajuanBaruNotification(
  spk: SpkEntity,
  pembayaran: SpkPembayaranEntity,
): NotificationPayload {
  const jenisLabel = JENIS_LABEL[pembayaran.jenis];
  const mandorName = pembayaran.diajukanOleh?.username ?? spk.mandor?.username ?? "Mandor";

  return {
    type: "SPK_PENGAJUAN_BARU",
    title: "Pengajuan Pembayaran SPK Baru",
    message: `${mandorName} mengajukan ${jenisLabel} (${formatRupiah(pembayaran.nominal)}) untuk SPK ${spk.noSpk}.`,
    data: {
      spkId: spk.id,
      noSpk: spk.noSpk,
      pembayaranId: pembayaran.id,
      jenis: pembayaran.jenis,
      nominal: pembayaran.nominal,
    },
    linkPath: "/proyek/approve-kasbon",
  };
}

export function buildSpkDisetujuiNotification(
  spk: SpkEntity,
  pembayaran: SpkPembayaranEntity,
): NotificationPayload {
  const jenisLabel = JENIS_LABEL[pembayaran.jenis];

  return {
    type: "SPK_DISETUJUI",
    title: "Pengajuan SPK Disetujui",
    message: `${jenisLabel} SPK ${spk.noSpk} (${formatRupiah(pembayaran.nominal)}) telah disetujui dan menunggu pembayaran.`,
    data: {
      spkId: spk.id,
      noSpk: spk.noSpk,
      pembayaranId: pembayaran.id,
      jenis: pembayaran.jenis,
      nominal: pembayaran.nominal,
    },
    linkPath: "/finance/bayar-spk",
  };
}

export function buildSpkDibayarNotification(
  spk: SpkEntity,
  pembayaran: SpkPembayaranEntity,
): NotificationPayload {
  const jenisLabel = JENIS_LABEL[pembayaran.jenis];

  return {
    type: "SPK_DIBAYAR",
    title: "Pembayaran SPK Selesai",
    message: `${jenisLabel} SPK ${spk.noSpk} sebesar ${formatRupiah(pembayaran.nominal)} telah dibayar.`,
    data: {
      spkId: spk.id,
      noSpk: spk.noSpk,
      pembayaranId: pembayaran.id,
      jenis: pembayaran.jenis,
      nominal: pembayaran.nominal,
      buktiPembayaran: pembayaran.buktiPembayaran,
      tanggalPembayaran: pembayaran.tanggalPembayaran?.toISOString() ?? null,
    },
    linkPath: "/proyek/spk",
  };
}
