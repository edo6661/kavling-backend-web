import type { NotificationPayload } from "../../infrastructure/notifications/NotificationService.js";

const formatRupiah = (value: number): string =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const formatKavling = (blok: string, nomorUnit: string, perumahan?: string) => {
  const unit = `Blok ${blok}-${nomorUnit}`;
  return perumahan ? `${perumahan} (${unit})` : unit;
};

export function buildTagihanUploadBuktiNotification(input: {
  namaCustomer: string;
  pembayaran: string;
  noTagihan: string;
  nominal: number;
  blok: string;
  nomorUnit: string;
  perumahan?: string;
  isCustomer: boolean;
}): NotificationPayload {
  const actor = input.isCustomer ? `Customer ${input.namaCustomer}` : "Staff";
  const kavling = formatKavling(input.blok, input.nomorUnit, input.perumahan);

  return {
    type: "UPLOAD_BUKTI",
    title: "Bukti Pembayaran Baru",
    message: [
      `${actor} mengunggah bukti pembayaran.`,
      `Customer: ${input.namaCustomer}`,
      `Tagihan: ${input.pembayaran} (${input.noTagihan})`,
      `Nominal: ${formatRupiah(input.nominal)}`,
      `Kavling: ${kavling}`,
      "Status: menunggu konfirmasi finance/admin.",
    ].join("\n"),
    data: { noTagihan: input.noTagihan },
    linkPath: "/finance/approve-pembayaran",
  };
}

export function buildBookingFeeUploadBuktiNotification(input: {
  namaCustomer: string;
  noTransaksi: string;
  pembayaran: string;
  noTagihan: string;
  nominal: number;
  blok: string;
  nomorUnit: string;
  perumahan?: string;
}): NotificationPayload {
  const kavling = formatKavling(input.blok, input.nomorUnit, input.perumahan);

  return {
    type: "UPLOAD_BUKTI",
    title: "Bukti Booking Fee Baru",
    message: [
      "Bukti transfer booking fee baru diunggah.",
      `Customer: ${input.namaCustomer}`,
      `Tagihan: ${input.pembayaran} (${input.noTagihan})`,
      `Nominal: ${formatRupiah(input.nominal)}`,
      `Transaksi: ${input.noTransaksi}`,
      `Kavling: ${kavling}`,
      "Status: menunggu konfirmasi finance/admin.",
    ].join("\n"),
    data: {
      noTagihan: input.noTagihan,
      penjualanId: input.noTransaksi,
    },
    linkPath: "/finance/approve-pembayaran",
  };
}
