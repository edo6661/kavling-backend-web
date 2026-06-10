import type { PrismaClient } from "@prisma/client";
import { Prisma } from "@prisma/client";
import type {
  MarketingReportDTO,
  MarketingReportFilterDTO,
  MarketingReportAgentRowDTO,
  MarketingReportPerusahaanRowDTO,
  MarketingReportFeeItemDTO,
} from "../../../domain/dtos/MarketingReportDTO.js";

const STATUS_LABEL: Record<string, string> = {
  BOOKED: "Booked",
  PROSES: "Proses",
  LUNAS: "Lunas",
  BATAL: "Batal",
};

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

function toNumber(value: Prisma.Decimal | number | null | undefined): number {
  if (value == null) return 0;
  return Number(value);
}

function toIsoDate(value: Date): string {
  return value.toISOString().substring(0, 10);
}

function parseDateStart(value?: string): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  return d;
}

function parseDateEnd(value?: string): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  d.setHours(23, 59, 59, 999);
  return d;
}

function monthLabel(date: Date): string {
  return `${MONTH_LABELS[date.getMonth()]} ${String(date.getFullYear()).slice(-2)}`;
}

function isFeePaid(
  nominal: Prisma.Decimal | null | undefined,
  bukti: string | null | undefined,
): boolean {
  return toNumber(nominal) > 0 && !!bukti;
}

function feeBelumCount(
  nominal: Prisma.Decimal | null | undefined,
  bukti: string | null | undefined,
): number {
  return toNumber(nominal) > 0 && !bukti ? toNumber(nominal) : 0;
}

function feeSudahCount(
  nominal: Prisma.Decimal | null | undefined,
  bukti: string | null | undefined,
): number {
  return isFeePaid(nominal, bukti) ? toNumber(nominal) : 0;
}

export class GetMarketingReportUseCase {
  constructor(private readonly db: PrismaClient) {}

  async execute(filters: MarketingReportFilterDTO): Promise<MarketingReportDTO> {
    const start = parseDateStart(filters.startDate);
    const end = parseDateEnd(filters.endDate);
    const now = new Date();

    const penjualanWhere: Prisma.PenjualanWhereInput = {
      ...(filters.agentId ? { agentId: filters.agentId } : {}),
      ...(filters.perusahaanAgentId
        ? { agent: { perusahaanAgentId: filters.perusahaanAgentId } }
        : {}),
      ...(filters.perumahanId
        ? { kavling: { perumahanId: filters.perumahanId } }
        : {}),
      ...(start || end
        ? {
            tanggal: {
              ...(start ? { gte: start } : {}),
              ...(end ? { lte: end } : {}),
            },
          }
        : {}),
    };

    const [
      totalKavling,
      kavlingTerjual,
      penjualanRows,
      statusGroups,
      feeRows,
      agentAktifCount,
    ] = await Promise.all([
      this.db.kavling.count(),
      this.db.kavling.count({ where: { status: "TERJUAL" } }),
      this.db.penjualan.findMany({
        where: penjualanWhere,
        orderBy: { tanggal: "desc" },
        select: {
          id: true,
          noTransaksi: true,
          tanggal: true,
          status: true,
          hargaJual: true,
          agentId: true,
          customer: { select: { nama: true } },
          agent: {
            select: {
              id: true,
              nama: true,
              perusahaanAgent: { select: { id: true, nama: true } },
            },
          },
          kavling: {
            select: { blok: true, nomorUnit: true },
          },
          feeAgent: {
            select: {
              id: true,
              bookingNominal: true,
              bookingBukti: true,
              closingNominal: true,
              closingBukti: true,
              marketingNominal: true,
              marketingBukti: true,
            },
          },
        },
      }),
      this.db.penjualan.groupBy({
        by: ["status"],
        where: penjualanWhere,
        _count: { id: true },
      }),
      this.db.feeAgent.findMany({
        where: { penjualan: penjualanWhere },
        select: {
          id: true,
          agentId: true,
          bookingNominal: true,
          bookingBukti: true,
          closingNominal: true,
          closingBukti: true,
          marketingNominal: true,
          marketingBukti: true,
          penjualan: {
            select: {
              id: true,
              noTransaksi: true,
              tanggal: true,
              status: true,
              customer: { select: { nama: true } },
              agent: {
                select: {
                  nama: true,
                  perusahaanAgent: { select: { id: true, nama: true } },
                },
              },
              kavling: { select: { blok: true, nomorUnit: true } },
            },
          },
        },
      }),
      this.db.agent.count({ where: { status: "AKTIF" } }),
    ]);

    const byStatus = statusGroups
      .map((g) => ({
        status: g.status,
        label: STATUS_LABEL[g.status] ?? g.status,
        count: g._count.id,
      }))
      .sort((a, b) => b.count - a.count);

    const monthMap = new Map<
      string,
      { bulan: string; bulanLabel: string; count: number; nominal: number }
    >();

    for (const p of penjualanRows) {
      const d = new Date(p.tanggal);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const existing = monthMap.get(key) ?? {
        bulan: key,
        bulanLabel: monthLabel(d),
        count: 0,
        nominal: 0,
      };
      existing.count += 1;
      existing.nominal += toNumber(p.hargaJual);
      monthMap.set(key, existing);
    }

    const penjualanBulanan = [...monthMap.values()].sort((a, b) =>
      a.bulan.localeCompare(b.bulan),
    );

    const agentMap = new Map<number, MarketingReportAgentRowDTO>();

    for (const p of penjualanRows) {
      if (!p.agentId || !p.agent) continue;

      const row =
        agentMap.get(p.agentId) ??
        ({
          agentId: p.agentId,
          nama: p.agent.nama,
          perusahaanNama: p.agent.perusahaanAgent?.nama ?? null,
          booked: 0,
          proses: 0,
          lunas: 0,
          batal: 0,
          totalClosing: 0,
          konversiRate: 0,
          totalFeeBooking: 0,
          totalFeeClosing: 0,
          totalFeeMarketing: 0,
          feeSudahDibayar: 0,
          feeBelumDibayar: 0,
        } satisfies MarketingReportAgentRowDTO);

      if (p.status === "BOOKED") row.booked += 1;
      else if (p.status === "PROSES") row.proses += 1;
      else if (p.status === "LUNAS") row.lunas += 1;
      else if (p.status === "BATAL") row.batal += 1;

      if (p.status === "LUNAS" || p.status === "PROSES") {
        row.totalClosing += 1;
      }

      agentMap.set(p.agentId, row);
    }

    for (const fee of feeRows) {
      const row = agentMap.get(fee.agentId);
      if (!row) continue;

      const booking = toNumber(fee.bookingNominal);
      const closing = toNumber(fee.closingNominal);
      const marketing = toNumber(fee.marketingNominal);

      row.totalFeeBooking += booking;
      row.totalFeeClosing += closing;
      row.totalFeeMarketing += marketing;
      row.feeSudahDibayar +=
        feeSudahCount(fee.bookingNominal, fee.bookingBukti) +
        feeSudahCount(fee.closingNominal, fee.closingBukti) +
        feeSudahCount(fee.marketingNominal, fee.marketingBukti);
      row.feeBelumDibayar +=
        feeBelumCount(fee.bookingNominal, fee.bookingBukti) +
        feeBelumCount(fee.closingNominal, fee.closingBukti) +
        feeBelumCount(fee.marketingNominal, fee.marketingBukti);
    }

    for (const row of agentMap.values()) {
      const denominator = row.booked + row.proses + row.lunas;
      row.konversiRate =
        denominator > 0 ? Math.round((row.lunas / denominator) * 100) : 0;
    }

    const byAgent = [...agentMap.values()].sort(
      (a, b) => b.totalClosing - a.totalClosing || b.lunas - a.lunas,
    );

    const perusahaanMap = new Map<number, MarketingReportPerusahaanRowDTO>();
    const perusahaanAgents = new Map<number, Set<number>>();

    for (const row of byAgent) {
      const agent = penjualanRows.find((p) => p.agentId === row.agentId)?.agent;
      const perusahaanId = agent?.perusahaanAgent?.id;
      if (!perusahaanId) continue;

      const agentSet = perusahaanAgents.get(perusahaanId) ?? new Set<number>();
      agentSet.add(row.agentId);
      perusahaanAgents.set(perusahaanId, agentSet);

      const existing =
        perusahaanMap.get(perusahaanId) ??
        ({
          perusahaanAgentId: perusahaanId,
          nama: agent.perusahaanAgent!.nama,
          jumlahAgent: 0,
          totalClosing: 0,
          totalFee: 0,
          feeSudahDibayar: 0,
        } satisfies MarketingReportPerusahaanRowDTO);

      existing.totalClosing += row.totalClosing;
      existing.totalFee +=
        row.totalFeeBooking + row.totalFeeClosing + row.totalFeeMarketing;
      existing.feeSudahDibayar += row.feeSudahDibayar;
      perusahaanMap.set(perusahaanId, existing);
    }

    for (const [id, agents] of perusahaanAgents) {
      const row = perusahaanMap.get(id);
      if (row) row.jumlahAgent = agents.size;
    }

    const byPerusahaan = [...perusahaanMap.values()].sort(
      (a, b) => b.totalClosing - a.totalClosing,
    );

    const feeItems: MarketingReportFeeItemDTO[] = feeRows.map((fee) => {
      const p = fee.penjualan;
      const booking = toNumber(fee.bookingNominal);
      const closing = toNumber(fee.closingNominal);
      const marketing = toNumber(fee.marketingNominal);

      return {
        feeId: fee.id,
        penjualanId: p.id,
        noTransaksi: p.noTransaksi,
        tanggal: toIsoDate(p.tanggal),
        penjualanStatus: p.status,
        customerNama: p.customer.nama,
        kavlingLabel: `Blok ${p.kavling.blok} - ${p.kavling.nomorUnit}`,
        agentNama: p.agent?.nama ?? "—",
        bookingNominal: booking,
        bookingSudahDibayar: isFeePaid(fee.bookingNominal, fee.bookingBukti),
        closingNominal: closing,
        closingSudahDibayar: isFeePaid(fee.closingNominal, fee.closingBukti),
        marketingNominal: marketing,
        marketingSudahDibayar: isFeePaid(
          fee.marketingNominal,
          fee.marketingBukti,
        ),
        totalFee: booking + closing + marketing,
      };
    });

    let totalFeeBooking = 0;
    let totalFeeClosing = 0;
    let totalFeeMarketing = 0;
    let feeBookingSudahDibayar = 0;
    let feeClosingSudahDibayar = 0;
    let feeMarketingSudahDibayar = 0;
    let feeBelumDibayar = 0;

    for (const fee of feeRows) {
      totalFeeBooking += toNumber(fee.bookingNominal);
      totalFeeClosing += toNumber(fee.closingNominal);
      totalFeeMarketing += toNumber(fee.marketingNominal);
      feeBookingSudahDibayar += feeSudahCount(
        fee.bookingNominal,
        fee.bookingBukti,
      );
      feeClosingSudahDibayar += feeSudahCount(
        fee.closingNominal,
        fee.closingBukti,
      );
      feeMarketingSudahDibayar += feeSudahCount(
        fee.marketingNominal,
        fee.marketingBukti,
      );
      feeBelumDibayar +=
        feeBelumCount(fee.bookingNominal, fee.bookingBukti) +
        feeBelumCount(fee.closingNominal, fee.closingBukti) +
        feeBelumCount(fee.marketingNominal, fee.marketingBukti);
    }

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const penjualanPeriode = penjualanRows.filter((p) => {
      const d = new Date(p.tanggal);
      return d >= monthStart;
    }).length;

    return {
      filters,
      summary: {
        totalKavling,
        kavlingTerjual,
        jumlahPenjualan: penjualanRows.length,
        penjualanPeriode,
        totalAgentAktif: agentAktifCount,
        totalFeeBooking,
        totalFeeClosing,
        totalFeeMarketing,
        feeBookingSudahDibayar,
        feeClosingSudahDibayar,
        feeMarketingSudahDibayar,
        feeBelumDibayar,
      },
      byStatus,
      penjualanBulanan,
      byAgent,
      byPerusahaan,
      feeItems,
    };
  }
}
