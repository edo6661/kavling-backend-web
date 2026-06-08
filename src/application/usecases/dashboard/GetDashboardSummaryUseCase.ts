import type { PrismaClient } from "@prisma/client";
import type {
  BlokHeatmapDTO,
  DashboardQueryDTO,
  DashboardResponseDTO,
  DocumentAlertDTO,
  KpiAlertDTO,
  KavlingRekeningBreakdownDTO,
  KpiComparisonDTO,
  ProgressRangeBreakdownDTO,
  StatusBreakdownDTO,
  TrendPointDTO,
  DashboardKpiPeriod,
} from "../../../domain/dtos/DashboardDTO.js";

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

const KAVLING_STATUS_LABELS: Record<string, string> = {
  AVAILABLE: "Tersedia",
  BOOKING: "Booking",
  TERJUAL: "Terjual",
  HOLD: "Hold",
};

const PENJUALAN_STATUS_LABELS: Record<string, string> = {
  BOOKED: "Booked",
  PROSES: "Proses",
  LUNAS: "Lunas",
  BATAL: "Batal",
};

const TAGIHAN_STATUS_LABELS: Record<string, string> = {
  BELUM_BAYAR: "Belum Bayar",
  MENUNGGU_KONFIRMASI: "Menunggu Konfirmasi",
  LUNAS: "Lunas",
};

function rekeningLabelFromAtasNama(atasNama: string): string {
  const upper = atasNama.toUpperCase();
  if (upper.includes("GAJAH")) return "Gajah";
  if (upper.includes("MAHLIGAI")) return "Mahligai";
  const words = atasNama.trim().split(/\s+/);
  return words[words.length - 1] ?? atasNama;
}

function monthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function monthEnd(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function monthLabel(date: Date): string {
  return `${MONTH_LABELS[date.getMonth()]} ${String(date.getFullYear()).slice(-2)}`;
}

function getLastNMonths(n: number, now: Date): { label: string; start: Date; end: Date }[] {
  const months = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      label: monthLabel(d),
      start: monthStart(d),
      end: monthEnd(d),
    });
  }
  return months;
}

function buildKpiComparison(current: number, previous: number): KpiComparisonDTO {
  let changePercent: number | null = null;
  if (previous > 0) {
    changePercent = Math.round(((current - previous) / previous) * 100);
  } else if (current > 0) {
    changePercent = 100;
  }

  let trend: KpiComparisonDTO["trend"] = "flat";
  if (changePercent !== null) {
    if (changePercent > 0) trend = "up";
    else if (changePercent < 0) trend = "down";
  }

  return { current, previous, changePercent, trend };
}

function progressRangeLabel(pct: number): string {
  if (pct < 25) return "0–24%";
  if (pct < 50) return "25–49%";
  if (pct < 75) return "50–74%";
  if (pct < 100) return "75–99%";
  return "100%";
}

function getQuarterStart(date: Date): Date {
  const q = Math.floor(date.getMonth() / 3);
  return new Date(date.getFullYear(), q * 3, 1);
}

function getQuarterEnd(date: Date): Date {
  const q = Math.floor(date.getMonth() / 3);
  return monthEnd(new Date(date.getFullYear(), q * 3 + 2, 1));
}

function getKpiPeriodRanges(now: Date, period: DashboardKpiPeriod) {
  if (period === "quarter") {
    const currentStart = getQuarterStart(now);
    const prevQuarterEnd = new Date(currentStart.getTime() - 1);
    const previousStart = getQuarterStart(prevQuarterEnd);
    return {
      current: { start: currentStart, end: now },
      previous: { start: previousStart, end: getQuarterEnd(prevQuarterEnd) },
      kpiPeriodLabel: "Kuartal ini",
      comparisonLabel: "vs kuartal lalu",
    };
  }

  if (period === "year") {
    const currentStart = new Date(now.getFullYear(), 0, 1);
    const previousStart = new Date(now.getFullYear() - 1, 0, 1);
    const previousEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
    return {
      current: { start: currentStart, end: now },
      previous: { start: previousStart, end: previousEnd },
      kpiPeriodLabel: "Tahun ini",
      comparisonLabel: "vs tahun lalu",
    };
  }

  const currentStart = monthStart(now);
  const lastMonthStart = monthStart(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  const lastMonthEnd = monthEnd(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  return {
    current: { start: currentStart, end: now },
    previous: { start: lastMonthStart, end: lastMonthEnd },
    kpiPeriodLabel: "Bulan ini",
    comparisonLabel: "vs bulan lalu",
  };
}

function detectConsecutiveDecline(trend: TrendPointDTO[]): boolean {
  if (trend.length < 3) return false;
  const last3 = trend.slice(-3);
  return last3[1]!.value < last3[0]!.value && last3[2]!.value < last3[1]!.value;
}

function buildKpiAlerts(
  revenueTrend: TrendPointDTO[],
  salesTrend: TrendPointDTO[],
): KpiAlertDTO[] {
  const alerts: KpiAlertDTO[] = [];

  if (detectConsecutiveDecline(revenueTrend)) {
    alerts.push({
      type: "revenue_decline",
      message: "Pendapatan turun 2 bulan berturut-turut",
      severity: "critical",
      actionHint: "Evaluasi strategi penagihan & follow-up tagihan jatuh tempo",
    });
  }

  if (detectConsecutiveDecline(salesTrend)) {
    alerts.push({
      type: "sales_decline",
      message: "Penjualan turun 2 bulan berturut-turut",
      severity: "warning",
      actionHint: "Percepat follow-up prospek & review performa agent",
    });
  }

  return alerts;
}

function buildBlokHeatmap(
  kavlings: { blok: string; status: string }[],
): BlokHeatmapDTO[] {
  const map = new Map<string, BlokHeatmapDTO>();

  for (const k of kavlings) {
    const existing = map.get(k.blok) ?? {
      blok: k.blok,
      total: 0,
      terjual: 0,
      available: 0,
      booking: 0,
      hold: 0,
      soldPercent: 0,
    };

    existing.total += 1;
    if (k.status === "TERJUAL") existing.terjual += 1;
    else if (k.status === "AVAILABLE") existing.available += 1;
    else if (k.status === "BOOKING") existing.booking += 1;
    else if (k.status === "HOLD") existing.hold += 1;

    map.set(k.blok, existing);
  }

  return Array.from(map.values())
    .map((b) => ({
      ...b,
      soldPercent: b.total > 0 ? Math.round((b.terjual / b.total) * 100) : 0,
    }))
    .sort((a, b) => a.blok.localeCompare(b.blok, "id"));
}

export class GetDashboardSummaryUseCase {
  constructor(private readonly db: PrismaClient) {}

  async execute(params: DashboardQueryDTO = {}): Promise<DashboardResponseDTO> {
    const now = new Date();
    const trendMonths = Math.min(12, Math.max(3, params.trendMonths ?? 6));
    const kpiPeriod = params.kpiPeriod ?? "month";
    const periodRanges = getKpiPeriodRanges(now, kpiPeriod);
    const { current: currentPeriod, previous: previousPeriod } = periodRanges;

    const trendStart = monthStart(
      new Date(now.getFullYear(), now.getMonth() - (trendMonths - 1), 1),
    );
    const monthRanges = getLastNMonths(trendMonths, now);

    const [
      totalTagihanLunas,
      kavlingTerjualCount,
      totalKavlingCount,
      bankRekenings,
      tagihanJatuhTempo,
      customerJatuhTempo,
      proyekAktifCount,
      progressProyek,
      recentPenjualan,
      topAgentsData,
      missingDocsCustomers,
      pendapatanBulanIniAgg,
      pendapatanBulanLaluAgg,
      penjualanBulanIniCount,
      penjualanBulanLaluCount,
      tagihanMenungguAgg,
      paidTagihanRecent,
      penjualanRecent,
      kavlingStatusGroups,
      penjualanStatusGroups,
      tagihanStatusGroups,
      allProgressProyek,
      tanpaRekeningTotal,
      tanpaRekeningTerjual,
      allKavlingsForHeatmap,
    ] = await Promise.all([
      this.db.tagihan.aggregate({
        _sum: { nominal: true },
        where: { status: "LUNAS" },
      }),
      this.db.kavling.count({ where: { status: "TERJUAL" } }),
      this.db.kavling.count(),
      this.db.bankRekeningPt.findMany({ orderBy: { id: "asc" } }),
      this.db.tagihan.aggregate({
        _sum: { nominal: true },
        where: { status: "BELUM_BAYAR", jatuhTempo: { lt: now } },
      }),
      this.db.tagihan.groupBy({
        by: ["customerId"],
        where: { status: "BELUM_BAYAR", jatuhTempo: { lt: now } },
      }),
      this.db.spkPenjualan.count(),
      this.db.progressProyek.aggregate({ _avg: { persentase: true } }),
      this.db.penjualan.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        where: { status: { not: "BATAL" } },
        include: {
          customer: { select: { nama: true } },
          kavling: { select: { blok: true, nomorUnit: true } },
        },
      }),
      this.db.penjualan.groupBy({
        by: ["agentId"],
        _count: { id: true },
        where: {
          agentId: { not: null },
          status: { in: ["LUNAS", "PROSES"] },
          createdAt: { gte: currentPeriod.start },
        },
        orderBy: { _count: { id: "desc" } },
        take: 3,
      }),
      this.db.customer.findMany({
        where: {
          OR: [{ fileKtp: null }, { fileKk: null }, { fileNpwp: null }],
          penjualan: { some: { status: { in: ["BOOKED", "PROSES"] } } },
        },
        include: {
          penjualan: {
            where: { status: { in: ["BOOKED", "PROSES"] } },
            include: { kavling: { select: { blok: true, nomorUnit: true } } },
            take: 1,
          },
        },
        take: 5,
      }),
      this.db.tagihan.aggregate({
        _sum: { nominal: true },
        where: { status: "LUNAS", updatedAt: { gte: currentPeriod.start, lte: currentPeriod.end } },
      }),
      this.db.tagihan.aggregate({
        _sum: { nominal: true },
        where: {
          status: "LUNAS",
          updatedAt: { gte: previousPeriod.start, lte: previousPeriod.end },
        },
      }),
      this.db.penjualan.count({
        where: {
          status: { not: "BATAL" },
          createdAt: { gte: currentPeriod.start, lte: currentPeriod.end },
        },
      }),
      this.db.penjualan.count({
        where: {
          status: { not: "BATAL" },
          createdAt: { gte: previousPeriod.start, lte: previousPeriod.end },
        },
      }),
      this.db.tagihan.aggregate({
        _sum: { nominal: true },
        _count: { id: true },
        where: { status: "MENUNGGU_KONFIRMASI" },
      }),
      this.db.tagihan.findMany({
        where: { status: "LUNAS", updatedAt: { gte: trendStart } },
        select: { nominal: true, updatedAt: true },
      }),
      this.db.penjualan.findMany({
        where: {
          createdAt: { gte: trendStart },
          status: { not: "BATAL" },
        },
        select: { createdAt: true },
      }),
      this.db.kavling.groupBy({ by: ["status"], _count: { id: true } }),
      this.db.penjualan.groupBy({ by: ["status"], _count: { id: true } }),
      this.db.tagihan.groupBy({
        by: ["status"],
        _count: { id: true },
        _sum: { nominal: true },
      }),
      this.db.progressProyek.findMany({
        select: { persentase: true, persentaseOverride: true },
      }),
      this.db.kavling.count({ where: { rekeningTujuanId: null } }),
      this.db.kavling.count({
        where: { rekeningTujuanId: null, status: "TERJUAL" },
      }),
      this.db.kavling.findMany({
        select: { blok: true, status: true },
      }),
    ]);

    const kavlingByRekening: KavlingRekeningBreakdownDTO[] = await Promise.all(
      bankRekenings.map(async (bank) => {
        const whereBase = { rekeningTujuanId: bank.id };
        const [total, terjual] = await Promise.all([
          this.db.kavling.count({ where: whereBase }),
          this.db.kavling.count({
            where: { ...whereBase, status: "TERJUAL" },
          }),
        ]);
        return {
          rekeningId: bank.id,
          label: rekeningLabelFromAtasNama(bank.atasNama),
          atasNama: bank.atasNama,
          total,
          terjual,
        };
      }),
    );

    if (tanpaRekeningTotal > 0) {
      kavlingByRekening.push({
        rekeningId: 0,
        label: "Tanpa Rekening",
        atasNama: "-",
        total: tanpaRekeningTotal,
        terjual: tanpaRekeningTerjual,
      });
    }

    const pendapatanBulanIni = Number(pendapatanBulanIniAgg._sum.nominal ?? 0);
    const pendapatanBulanLalu = Number(pendapatanBulanLaluAgg._sum.nominal ?? 0);

    const revenueTrend: TrendPointDTO[] = monthRanges.map((m) => ({
      label: m.label,
      value: paidTagihanRecent
        .filter((t) => t.updatedAt >= m.start && t.updatedAt <= m.end)
        .reduce((sum, t) => sum + Number(t.nominal), 0),
    }));

    const salesTrend: TrendPointDTO[] = monthRanges.map((m) => ({
      label: m.label,
      value: penjualanRecent.filter(
        (p) => p.createdAt >= m.start && p.createdAt <= m.end,
      ).length,
    }));

    const menungguTagihanRecent = await this.db.tagihan.findMany({
      where: {
        status: "MENUNGGU_KONFIRMASI",
        updatedAt: { gte: trendStart },
      },
      select: { nominal: true, updatedAt: true },
    });

    const collectionTrend = monthRanges.map((m) => ({
      label: m.label,
      terkumpul: paidTagihanRecent
        .filter((t) => t.updatedAt >= m.start && t.updatedAt <= m.end)
        .reduce((sum, t) => sum + Number(t.nominal), 0),
      menungguKonfirmasi: menungguTagihanRecent
        .filter((t) => t.updatedAt >= m.start && t.updatedAt <= m.end)
        .reduce((sum, t) => sum + Number(t.nominal), 0),
    }));

    const kavlingByStatus: StatusBreakdownDTO[] = kavlingStatusGroups.map(
      (g) => ({
        status: g.status,
        label: KAVLING_STATUS_LABELS[g.status] ?? g.status,
        count: g._count.id,
      }),
    );

    const penjualanByStatus: StatusBreakdownDTO[] = penjualanStatusGroups.map(
      (g) => ({
        status: g.status,
        label: PENJUALAN_STATUS_LABELS[g.status] ?? g.status,
        count: g._count.id,
      }),
    );

    const tagihanByStatus: StatusBreakdownDTO[] = tagihanStatusGroups.map(
      (g) => ({
        status: g.status,
        label: TAGIHAN_STATUS_LABELS[g.status] ?? g.status,
        count: g._count.id,
        nominal: Number(g._sum.nominal ?? 0),
      }),
    );

    const progressRangeMap = new Map<string, number>();
    for (const prog of allProgressProyek) {
      const pct = Number(prog.persentaseOverride ?? prog.persentase);
      const range = progressRangeLabel(pct);
      progressRangeMap.set(range, (progressRangeMap.get(range) ?? 0) + 1);
    }
    const progressOrder = ["0–24%", "25–49%", "50–74%", "75–99%", "100%"];
    const progressBreakdown: ProgressRangeBreakdownDTO[] = progressOrder
      .filter((r) => progressRangeMap.has(r))
      .map((range) => ({ range, count: progressRangeMap.get(range)! }));

    const recentTransactions = recentPenjualan.map((p) => ({
      id: p.noTransaksi,
      customer: p.customer.nama,
      kavling: `${p.kavling.blok} - ${p.kavling.nomorUnit}`,
      type: p.caraPembayaran ?? "",
      amount: Number(p.hargaJual),
      status: p.status,
      date: p.createdAt.toISOString().substring(0, 10),
    }));

    const latestProgress = await this.db.progressProyek.findMany({
      take: 5,
      orderBy: { updatedAt: "desc" },
      include: {
        kavling: { select: { blok: true, nomorUnit: true } },
        penjualan: {
          include: { customer: { select: { nama: true } } },
        },
        tahapan: { orderBy: { tanggal: "desc" }, take: 1 },
      },
    });

    const progressData = latestProgress.map((prog) => {
      const pct = Number(prog.persentaseOverride ?? prog.persentase);
      const kavlingLabel = prog.kavling
        ? `Blok ${prog.kavling.blok} - ${prog.kavling.nomorUnit}`
        : "—";
      const customer = prog.penjualan?.customer?.nama ?? "—";

      return {
        kavling: kavlingLabel,
        customer,
        progress: pct,
        tahap: prog.tahapan[0]?.namaTahapan ?? "Belum ada laporan",
        isLate: pct < 50,
      };
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
            : "—",
          missing,
        };
      },
    );

    const blokHeatmap = buildBlokHeatmap(allKavlingsForHeatmap);
    const kpiAlerts = buildKpiAlerts(revenueTrend, salesTrend);

    return {
      stats: {
        totalPendapatan: Number(totalTagihanLunas._sum.nominal ?? 0),
        kavlingTerjual: kavlingTerjualCount,
        totalKavling: totalKavlingCount,
        kavlingByRekening,
        tagihanJatuhTempo: Number(tagihanJatuhTempo._sum.nominal ?? 0),
        customerJatuhTempo: customerJatuhTempo.length,
        proyekAktif: proyekAktifCount,
        rataRataProgress: Number(progressProyek._avg.persentase ?? 0),
        pendapatanBulanIni,
        pendapatanBulanLalu,
        penjualanBulanIni: penjualanBulanIniCount,
        penjualanBulanLalu: penjualanBulanLaluCount,
        tagihanMenungguKonfirmasi: tagihanMenungguAgg._count.id,
        tagihanMenungguKonfirmasiNominal: Number(
          tagihanMenungguAgg._sum.nominal ?? 0,
        ),
        kpiComparison: {
          pendapatan: buildKpiComparison(pendapatanBulanIni, pendapatanBulanLalu),
          penjualan: buildKpiComparison(
            penjualanBulanIniCount,
            penjualanBulanLaluCount,
          ),
        },
      },
      recentTransactions,
      progressData,
      topAgents,
      documentAlerts,
      revenueTrend,
      salesTrend,
      collectionTrend,
      kavlingByStatus,
      penjualanByStatus,
      tagihanByStatus,
      progressBreakdown,
      blokHeatmap,
      kpiAlerts,
      filters: {
        trendMonths,
        kpiPeriod,
        kpiPeriodLabel: periodRanges.kpiPeriodLabel,
        comparisonLabel: periodRanges.comparisonLabel,
      },
    };
  }
}
