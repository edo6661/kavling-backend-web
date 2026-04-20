import type { PrismaClient } from "@prisma/client";

export class GetPengajuanBatalUseCase {
  constructor(private readonly db: PrismaClient) {}

  async execute(status?: "PENDING" | "APPROVED" | "REJECTED") {
    const whereClause = status ? { status } : {};

    return await this.db.pengajuanBatal.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        penjualan: {
          include: {
            customer: { select: { nama: true, noHp: true } },
            kavling: { include: { perumahan: { select: { nama: true } } } },
          },
        },
        requestedBy: { select: { username: true } },
        approvedBy: { select: { username: true } },
      },
    });
  }
}
