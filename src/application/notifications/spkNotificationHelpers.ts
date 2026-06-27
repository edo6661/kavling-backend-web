import type { SpkPembayaranJenis } from "@prisma/client";
import type { SpkEntity } from "../../domain/entities/Spk.js";
import type { SpkPembayaranEntity } from "../../domain/entities/SpkPembayaran.js";
import type { NotificationPayload } from "../../infrastructure/notifications/NotificationService.js";
import { buildAllSpkPembayaranJenisLabel } from "../../domain/spk/spkTerminScheme.js";

const JENIS_LABEL: Record<SpkPembayaranJenis, string> = buildAllSpkPembayaranJenisLabel();

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
