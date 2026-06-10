import type { KodeBillingPphResponseDTO } from "../../domain/dtos/KodeBillingPphDTO.js";
import type { NotificationPayload } from "../../infrastructure/notifications/NotificationService.js";

function formatKavlingLabel(record: KodeBillingPphResponseDTO): string {
  const parts = [record.perumahan, record.blok, record.nomorUnit].filter(Boolean);
  return parts.length ? parts.join(" · ") : "kavling";
}

export function buildKodeBillingPphBaruNotification(
  record: KodeBillingPphResponseDTO,
): NotificationPayload {
  const kavling = formatKavlingLabel(record);
  const tanahLabel =
    (record.sertifikatUrutan ?? 1) > 1
      ? ` (Tanah ${record.sertifikatUrutan})`
      : "";

  return {
    type: "KODE_BILLING_PPH",
    title: "Kode Billing PPh Baru",
    message: `${record.namaCustomer} — ${kavling}${tanahLabel}: kode billing ${record.kodeBilling} menunggu pembayaran.`,
    data: {
      kodeBillingPphId: record.id,
      penjualanId: record.penjualanId,
      kodeBilling: record.kodeBilling,
      sertifikatUrutan: record.sertifikatUrutan ?? 1,
    },
    linkPath: "/finance/bayar-kode-billing-pph",
  };
}
