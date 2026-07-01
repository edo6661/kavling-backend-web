import type { PenjualanBulanCaraPembayaran } from "./dashboardPenjualanBulan.js";

const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const PERIODE_FILTER_RE =
  /^PENJUALAN_PERIODE:(\d{4}-\d{2}-\d{2}):(\d{4}-\d{2}-\d{2}):(KPR|CASH_BERTAHAP|CASH_KERAS|SEMUA)$/;

export function parseIsoDateParts(
  iso: string,
): { year: number; month: number; day: number } | null {
  const match = iso.match(ISO_DATE_RE);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (!Number.isFinite(year) || month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }

  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
}

export function parseDateRangeFromIso(
  dateFrom: string,
  dateTo: string,
): { start: Date; end: Date } | null {
  const from = parseIsoDateParts(dateFrom);
  const to = parseIsoDateParts(dateTo);
  if (!from || !to) return null;

  const start = new Date(from.year, from.month - 1, from.day, 0, 0, 0, 0);
  const end = new Date(to.year, to.month - 1, to.day, 23, 59, 59, 999);
  if (start > end) return null;

  return { start, end };
}

export function buildPenjualanPeriodeDrilldownFilter(
  dateFrom: string,
  dateTo: string,
  caraPembayaran: PenjualanBulanCaraPembayaran,
): string {
  return `PENJUALAN_PERIODE:${dateFrom}:${dateTo}:${caraPembayaran}`;
}

export function parsePenjualanPeriodeFilter(filter?: string): {
  dateFrom: string;
  dateTo: string;
  caraPembayaran: PenjualanBulanCaraPembayaran;
} | null {
  const match = filter?.match(PERIODE_FILTER_RE);
  if (!match) return null;

  const dateFrom = match[1]!;
  const dateTo = match[2]!;
  const caraPembayaran = match[3] as PenjualanBulanCaraPembayaran;

  if (!parseDateRangeFromIso(dateFrom, dateTo)) return null;

  return { dateFrom, dateTo, caraPembayaran };
}

export function buildPenjualanCaraWhere(caraPembayaran: PenjualanBulanCaraPembayaran) {
  if (caraPembayaran === "SEMUA") {
    return {
      caraPembayaran: {
        in: ["KPR", "CASH_BERTAHAP", "CASH_KERAS"] as const,
      },
    };
  }

  return { caraPembayaran };
}
