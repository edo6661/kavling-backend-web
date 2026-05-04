import type { PrismaClient } from "@prisma/client";
import type {
  DashboardResponseDTO,
  DocumentAlertDTO,
} from "../../../domain/dtos/DashboardDTO.js";

export class GetDashboardSummaryUseCase {
  constructor(private readonly db: PrismaClient) {}

  async execute(): Promise<DashboardResponseDTO> {
    const now = new Date();

    const totalTagihanLunas = await this.db.tagihan.aggregate({
      _sum: { nominal: true },
      where: { status: "LUNAS" },
    });

    const kavlingTerjualCount = await this.db.kavling.count({
      where: { status: "TERJUAL" },
    });

    const totalKavlingCount = await this.db.kavling.count();

    const tagihanJatuhTempo = await this.db.tagihan.aggregate({
      _sum: { nominal: true },
      where: { status: "BELUM_BAYAR", jatuhTempo: { lt: now } },
    });

    const customerJatuhTempo = await this.db.tagihan.groupBy({
      by: ["customerId"],
      where: { status: "BELUM_BAYAR", jatuhTempo: { lt: now } },
    });

    const proyekAktifCount = await this.db.spk.count();

    const progressProyek = await this.db.progressProyek.aggregate({
      _avg: { persentase: true },
    });

    const recentPenjualan = await this.db.penjualan.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { nama: true } },
        kavling: { select: { blok: true, nomorUnit: true } },
      },
    });

    const recentTransactions = recentPenjualan.map((p) => ({
      id: p.noTransaksi,
      customer: p.customer.nama,
      kavling: `${p.kavling.blok} - ${p.kavling.nomorUnit}`,
      type: p.caraPembayaran,
      amount: Number(p.hargaJual),
      status: p.status,
      date: p.createdAt.toISOString().substring(0, 10),
    }));

    const latestProgress = await this.db.progressProyek.findMany({
      take: 5,
      orderBy: { tanggalLaporan: "desc" },
      include: {
        kavling: {
          include: {
            penjualan: {
              include: { customer: { select: { nama: true } } },
              take: 1,
            },
          },
        },
      },
    });

    const progressData = latestProgress.map((prog) => ({
      kavling: `Blok ${prog.kavling.blok} - ${prog.kavling.nomorUnit}`,
      customer: prog.kavling.penjualan[0]?.customer?.nama ?? "Unknown",
      progress: prog.persentase,
      tahap: prog.tahapanPekerjaan,
      isLate: false,
    }));

    const topAgentsData = await this.db.penjualan.groupBy({
      by: ["agentId"],
      _count: { id: true },
      where: { agentId: { not: null }, status: { in: ["LUNAS", "PROSES"] } },
      orderBy: { _count: { id: "desc" } },
      take: 3,
    });

    const topAgents = await Promise.all(
      topAgentsData.map(async (ta) => {
        const agent = await this.db.agent.findUnique({
          where: { id: ta.agentId! },
          select: { nama: true },
        });

        const fee = await this.db.feeAgent.aggregate({
          _sum: { closingNominal: true },
          where: { agentId: ta.agentId! },
        });

        return {
          name: agent?.nama ?? "Unknown",
          closing: ta._count.id,
          feeStatus: `Rp ${(fee._sum.closingNominal ?? 0).toLocaleString("id-ID")}`,
        };
      }),
    );

    const missingDocsCustomers = await this.db.customer.findMany({
      where: {
        OR: [{ fileKtp: null }, { fileKk: null }, { fileNpwp: null }],
      },
      include: {
        penjualan: {
          include: { kavling: { select: { blok: true, nomorUnit: true } } },
          take: 1,
        },
      },
      take: 5,
    });

    const documentAlerts: DocumentAlertDTO[] = missingDocsCustomers.map(
      (cust) => {
        const missing = [];
        if (!cust.fileKtp) missing.push("KTP");
        if (!cust.fileKk) missing.push("KK");
        if (!cust.fileNpwp) missing.push("NPWP");

        return {
          customer: cust.nama,
          kavling: cust.penjualan[0]
            ? `Blok ${cust.penjualan[0].kavling.blok} - ${cust.penjualan[0].kavling.nomorUnit}`
            : "Belum Beli",
          missing,
        };
      },
    );

    return {
      stats: {
        totalPendapatan: Number(totalTagihanLunas._sum.nominal ?? 0),
        kavlingTerjual: kavlingTerjualCount,
        totalKavling: totalKavlingCount,
        tagihanJatuhTempo: Number(tagihanJatuhTempo._sum.nominal ?? 0),
        customerJatuhTempo: customerJatuhTempo.length,
        proyekAktif: proyekAktifCount,
        rataRataProgress: Number(progressProyek._avg.persentase ?? 0),
      },
      recentTransactions,
      progressData,
      topAgents,
      documentAlerts,
    };
  }
}
