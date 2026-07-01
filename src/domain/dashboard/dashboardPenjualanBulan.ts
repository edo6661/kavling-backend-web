export type PenjualanBulanCaraPembayaran = "KPR" | "CASH_BERTAHAP" | "CASH_KERAS";

export interface MonthlyPenjualanCountRow {
  month: number;
  monthLabel: string;
  total: number;
  count: number;
}

const FULL_MONTH_LABELS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

function monthRange(year: number, monthIndex: number): { start: Date; end: Date } {
  const start = new Date(year, monthIndex, 1);
  const end = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

export function buildPenjualanBulanDrilldownFilter(
  year: number,
  month: number,
  caraPembayaran: PenjualanBulanCaraPembayaran,
): string {
  return `PENJUALAN_BULAN:${year}:${month}:${caraPembayaran}`;
}

export function parsePenjualanBulanFilter(filter?: string): {
  year: number;
  month: number;
  caraPembayaran: PenjualanBulanCaraPembayaran;
} | null {
  const match = filter?.match(
    /^PENJUALAN_BULAN:(\d{4}):(\d{1,2}):(KPR|CASH_BERTAHAP|CASH_KERAS)$/,
  );
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const caraPembayaran = match[3] as PenjualanBulanCaraPembayaran;

  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    return null;
  }

  return { year, month, caraPembayaran };
}

export function buildPenjualanByCaraTahunIni(
  year: number,
  penjualanYear: {
    hargaJual: unknown;
    createdAt: Date;
    caraPembayaran: string | null;
  }[],
): {
  kpr: MonthlyPenjualanCountRow[];
  cashBertahap: MonthlyPenjualanCountRow[];
  cashKeras: MonthlyPenjualanCountRow[];
} {
  const buildForCara = (cara: PenjualanBulanCaraPembayaran) =>
    FULL_MONTH_LABELS.map((monthLabel, monthIndex) => {
      const { start, end } = monthRange(year, monthIndex);
      const inMonth = penjualanYear.filter(
        (p) =>
          p.caraPembayaran === cara && p.createdAt >= start && p.createdAt <= end,
      );

      return {
        month: monthIndex + 1,
        monthLabel,
        total: inMonth.reduce((sum, p) => sum + Number(p.hargaJual ?? 0), 0),
        count: inMonth.length,
      };
    });

  return {
    kpr: buildForCara("KPR"),
    cashBertahap: buildForCara("CASH_BERTAHAP"),
    cashKeras: buildForCara("CASH_KERAS"),
  };
}
