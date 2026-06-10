import type { PrismaClient } from "@prisma/client";
import type {
  BookingRateRowDTO,
  ExecutiveDashboardDTO,
  ExecutiveKpiDTO,
  MonthlyMetricRowDTO,
} from "../../../domain/dtos/DashboardDTO.js";

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

function dayStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function dayEnd(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function monthRange(year: number, monthIndex: number): { start: Date; end: Date } {
  const start = new Date(year, monthIndex, 1);
  const end = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

function buildMonthlyRows(
  year: number,
  getValues: (monthIndex: number) => { total: number; count: number },
): MonthlyMetricRowDTO[] {
  return FULL_MONTH_LABELS.map((monthLabel, monthIndex) => {
    const { total, count } = getValues(monthIndex);
    return { month: monthIndex + 1, monthLabel, total, count };
  });
}

export class GetExecutiveDashboardUseCase {
  constructor(private readonly db: PrismaClient) {}

  async execute(now: Date = new Date()): Promise<ExecutiveDashboardDTO> {
    const year = now.getFullYear();
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999);
    const todayStart = dayStart(now);
    const todayEnd = dayEnd(now);
    const monthStartDate = new Date(year, now.getMonth(), 1);
    const monthEndDate = new Date(year, now.getMonth() + 1, 0, 23, 59, 59, 999);

    const [
      unitTersedia,
      akadBulanIni,
      unitBookingHariIni,
      unitProsesHariIni,
      totalUnitKpr,
      totalUnitCashBertahap,
      totalKavling,
      paidTagihanYear,
      akadDetailsYear,
      penjualanCashYear,
      penjualanYear,
    ] = await Promise.all([
      this.db.kavling.count({ where: { status: "AVAILABLE" } }),
      this.db.detailKavlingPajak.count({
        where: {
          tanggalAkadPpjb: { gte: monthStartDate, lte: monthEndDate },
          penjualan: { status: { not: "BATAL" } },
        },
      }),
      this.db.penjualan.count({
        where: {
          status: { not: "BATAL" },
          createdAt: { gte: todayStart, lte: todayEnd },
        },
      }),
      this.db.penjualan.count({
        where: {
          status: "PROSES",
          updatedAt: { gte: todayStart, lte: todayEnd },
        },
      }),
      this.db.penjualan.count({
        where: { caraPembayaran: "KPR", status: { not: "BATAL" } },
      }),
      this.db.penjualan.count({
        where: { caraPembayaran: "CASH_BERTAHAP", status: { not: "BATAL" } },
      }),
      this.db.kavling.count(),
      this.db.tagihan.findMany({
        where: {
          status: "LUNAS",
          updatedAt: { gte: yearStart, lte: yearEnd },
        },
        select: { nominal: true, updatedAt: true },
      }),
      this.db.detailKavlingPajak.findMany({
        where: {
          tanggalAkadPpjb: { gte: yearStart, lte: yearEnd },
          penjualan: { status: { not: "BATAL" } },
        },
        select: {
          tanggalAkadPpjb: true,
          penjualan: { select: { hargaJual: true } },
        },
      }),
      this.db.penjualan.findMany({
        where: {
          caraPembayaran: { in: ["CASH_KERAS", "CASH_BERTAHAP"] },
          status: { not: "BATAL" },
          createdAt: { gte: yearStart, lte: yearEnd },
        },
        select: { hargaJual: true, createdAt: true },
      }),
      this.db.penjualan.findMany({
        where: {
          status: { not: "BATAL" },
          createdAt: { gte: yearStart, lte: yearEnd },
        },
        select: { createdAt: true },
      }),
    ]);

    const kpi: ExecutiveKpiDTO = {
      unitTersedia,
      akadBulanIni,
      unitBookingHariIni,
      unitProsesHariIni,
      totalUnitKpr,
      totalUnitCashBertahap,
    };

    const pendapatanTahunIni = buildMonthlyRows(year, (monthIndex) => {
      const { start, end } = monthRange(year, monthIndex);
      const inMonth = paidTagihanYear.filter(
        (t) => t.updatedAt >= start && t.updatedAt <= end,
      );
      return {
        total: inMonth.reduce((sum, t) => sum + Number(t.nominal), 0),
        count: inMonth.length,
      };
    });

    const akadTahunIni = buildMonthlyRows(year, (monthIndex) => {
      const { start, end } = monthRange(year, monthIndex);
      const inMonth = akadDetailsYear.filter(
        (d) =>
          d.tanggalAkadPpjb &&
          d.tanggalAkadPpjb >= start &&
          d.tanggalAkadPpjb <= end,
      );
      return {
        total: inMonth.reduce(
          (sum, d) => sum + Number(d.penjualan.hargaJual ?? 0),
          0,
        ),
        count: inMonth.length,
      };
    });

    const penjualanCashTahunIni = buildMonthlyRows(year, (monthIndex) => {
      const { start, end } = monthRange(year, monthIndex);
      const inMonth = penjualanCashYear.filter(
        (p) => p.createdAt >= start && p.createdAt <= end,
      );
      return {
        total: inMonth.reduce((sum, p) => sum + Number(p.hargaJual ?? 0), 0),
        count: inMonth.length,
      };
    });

    const tingkatPemesanan: BookingRateRowDTO[] = FULL_MONTH_LABELS.map(
      (monthLabel, monthIndex) => {
        const { start, end } = monthRange(year, monthIndex);
        const jumlahPemesanan = penjualanYear.filter(
          (p) => p.createdAt >= start && p.createdAt <= end,
        ).length;
        const tingkatPersen =
          totalKavling > 0
            ? Math.round((jumlahPemesanan / totalKavling) * 1000) / 10
            : 0;
        return { month: monthIndex + 1, monthLabel, jumlahPemesanan, tingkatPersen };
      },
    );

    return {
      year,
      kpi,
      pendapatanTahunIni,
      akadTahunIni,
      penjualanCashTahunIni,
      tingkatPemesanan,
    };
  }
}
