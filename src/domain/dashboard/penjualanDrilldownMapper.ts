import type { Prisma } from "@prisma/client";
import type { DrilldownItemDTO } from "../dtos/DashboardDTO.js";

const PENJUALAN_STATUS_LABELS: Record<string, string> = {
  BOOKED: "Booked",
  PROSES: "Proses",
  LUNAS: "Lunas",
  BATAL: "Batal",
};

const CARA_PEMBAYARAN_LABELS: Record<string, string> = {
  KPR: "KPR",
  CASH_BERTAHAP: "Cash Bertahap",
  CASH_KERAS: "Cash Keras",
};

function formatCaraPembayaranLabel(caraPembayaran: string | null): string {
  if (!caraPembayaran) return "—";
  return CARA_PEMBAYARAN_LABELS[caraPembayaran] ?? caraPembayaran;
}

export const PENJUALAN_DRILLDOWN_INCLUDE = {
  customer: { select: { nama: true } },
  kavling: { select: { blok: true, nomorUnit: true } },
  agent: { select: { nama: true } },
  tagihan: {
    where: { tujuan: "BOOKING_FEE" },
    select: { status: true, jatuhTempo: true },
    orderBy: { id: "asc" },
    take: 1,
  },
} satisfies Prisma.PenjualanInclude;

export type PenjualanDrilldownRow = Prisma.PenjualanGetPayload<{
  include: typeof PENJUALAN_DRILLDOWN_INCLUDE;
}>;

function resolveBookingFeePaymentDate(
  tagihan: PenjualanDrilldownRow["tagihan"],
): string | undefined {
  const bookingFee = tagihan[0];
  if (!bookingFee || bookingFee.status !== "LUNAS") return undefined;
  return bookingFee.jatuhTempo.toISOString().substring(0, 10);
}

export function mapPenjualanToDrilldownItem(
  penjualan: PenjualanDrilldownRow,
  overrides?: Partial<DrilldownItemDTO>,
): DrilldownItemDTO {
  const bookingFeeTagihan = penjualan.tagihan[0];
  const bookingFeeLunas = bookingFeeTagihan?.status === "LUNAS";
  const tanggalBayarBookingFee = resolveBookingFeePaymentDate(penjualan.tagihan);

  return {
    id: penjualan.noTransaksi,
    label: penjualan.customer.nama,
    sublabel: `Blok ${penjualan.kavling.blok} - ${penjualan.kavling.nomorUnit}`,
    value: `Rp ${Number(penjualan.hargaJual ?? 0).toLocaleString("id-ID")}`,
    status: PENJUALAN_STATUS_LABELS[penjualan.status] ?? penjualan.status,
    tanggalBooking: penjualan.createdAt.toISOString().substring(0, 10),
    ...(tanggalBayarBookingFee ? { tanggalBayarBookingFee } : {}),
    bookingFeeLunas,
    agentNama: penjualan.agent?.nama ?? "",
    caraPembayaranLabel: formatCaraPembayaranLabel(penjualan.caraPembayaran),
    ...overrides,
  };
}

export function mapPenjualanListToDrilldownItems(
  penjualan: PenjualanDrilldownRow[],
): DrilldownItemDTO[] {
  return penjualan.map((row) => mapPenjualanToDrilldownItem(row));
}
