import type { PrismaClient } from "@prisma/client";
import type { PenjualanPeriodeSummaryDTO } from "../../../domain/dtos/DashboardDTO.js";
import { parseDateRangeFromIso } from "../../../domain/dashboard/dashboardPenjualanPeriode.js";

export class GetPenjualanPeriodeSummaryUseCase {
  constructor(private readonly db: PrismaClient) {}

  async execute(input: {
    dateFrom: string;
    dateTo: string;
  }): Promise<PenjualanPeriodeSummaryDTO> {
    const range = parseDateRangeFromIso(input.dateFrom, input.dateTo);
    if (!range) {
      throw new Error("Rentang tanggal tidak valid");
    }

    const baseWhere = {
      status: { not: "BATAL" as const },
      createdAt: { gte: range.start, lte: range.end },
    };

    const [kpr, cashBertahap, cashKeras] = await Promise.all([
      this.db.penjualan.count({ where: { ...baseWhere, caraPembayaran: "KPR" } }),
      this.db.penjualan.count({
        where: { ...baseWhere, caraPembayaran: "CASH_BERTAHAP" },
      }),
      this.db.penjualan.count({
        where: { ...baseWhere, caraPembayaran: "CASH_KERAS" },
      }),
    ]);

    return {
      kpr,
      cashBertahap,
      cashKeras,
      semua: kpr + cashBertahap + cashKeras,
    };
  }
}
