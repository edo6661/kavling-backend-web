import type { PrismaClient } from "@prisma/client";
import type { IDashboardRepository } from "./IDashboardRepo.js";
import type { DashboardSummaryResponseDTO } from "../dtos/DashboardDTO.js";

export class DashboardRepository implements IDashboardRepository {
  constructor(private readonly db: PrismaClient) {}

  async getSummary(): Promise<DashboardSummaryResponseDTO> {
    const [
      totalUnitTersedia,
      totalUnitBooking,
      totalUnitTerjual,
      totalSprAktif,
      revenueResult,
    ] = await Promise.all([
      this.db.unit.count({ where: { status: "TERSEDIA" } }),
      this.db.unit.count({ where: { status: "BOOKING" } }),
      this.db.unit.count({ where: { status: "TERJUAL" } }),
      this.db.spr.count({ where: { status: "AKTIF" } }),
      this.db.spr.aggregate({
        _sum: { hargaJual: true },
        where: { status: "AKTIF" },
      }),
    ]);

    return {
      totalUnitTersedia,
      totalUnitBooking,
      totalUnitTerjual,
      totalSprAktif,
      totalRevenue: revenueResult._sum.hargaJual
        ? Number(revenueResult._sum.hargaJual)
        : 0,
    };
  }
}
