import type { PrismaClient } from "@prisma/client";
import type {
  DashboardDrilldownQueryDTO,
  DrilldownItemDTO,
} from "../../../domain/dtos/DashboardDTO.js";
import { parsePenjualanBulanFilter } from "../../../domain/dashboard/dashboardPenjualanBulan.js";
import { normalizeTagihanFileBuktiList } from "../../../utils/tagihanBukti.js";

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

function progressInRange(pct: number, range: string): boolean {
  if (range === "0–24%") return pct < 25;
  if (range === "25–49%") return pct >= 25 && pct < 50;
  if (range === "50–74%") return pct >= 50 && pct < 75;
  if (range === "75–99%") return pct >= 75 && pct < 100;
  if (range === "100%") return pct >= 100;
  return true;
}

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

function parsePendapatanFilter(filter?: string): { year: number; month: number } | null {
  const match = filter?.match(/^PENDAPATAN:(\d{4}):(\d{1,2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    return null;
  }
  return { year, month };
}

export class GetDashboardDrilldownUseCase {
  constructor(private readonly db: PrismaClient) {}

  async execute(query: DashboardDrilldownQueryDTO): Promise<DrilldownItemDTO[]> {
    const { category, filter, blok } = query;

    switch (category) {
      case "kavling":
        return this.drilldownKavling(filter, blok);
      case "penjualan":
        return this.drilldownPenjualan(filter);
      case "tagihan":
        return this.drilldownTagihan(filter);
      case "progress":
        return this.drilldownProgress(filter);
      default:
        return [];
    }
  }

  private async drilldownKavling(status?: string, blok?: string): Promise<DrilldownItemDTO[]> {
    const kavlings = await this.db.kavling.findMany({
      where: {
        ...(status && ["AVAILABLE", "BOOKING", "TERJUAL", "HOLD"].includes(status)
          ? { status: status as "AVAILABLE" | "BOOKING" | "TERJUAL" | "HOLD" }
          : {}),
        ...(blok ? { blok } : {}),
      },
      orderBy: [{ blok: "asc" }, { nomorUnit: "asc" }],
      take: 50,
      select: { id: true, blok: true, nomorUnit: true, status: true, hargaDasar: true },
    });

    return kavlings.map((k) => ({
      id: String(k.id),
      label: `Blok ${k.blok} - ${k.nomorUnit}`,
      sublabel: KAVLING_STATUS_LABELS[k.status] ?? k.status,
      value: `Rp ${Number(k.hargaDasar).toLocaleString("id-ID")}`,
      status: k.status,
    }));
  }

  private async drilldownPenjualan(status?: string): Promise<DrilldownItemDTO[]> {
    const now = new Date();
    const todayStart = dayStart(now);
    const todayEnd = dayEnd(now);
    const monthStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    if (status === "BOOKED_TODAY") {
      return this.mapPenjualanItems(
        await this.db.penjualan.findMany({
          where: {
            status: { not: "BATAL" },
            createdAt: { gte: todayStart, lte: todayEnd },
          },
          orderBy: { createdAt: "desc" },
          take: 50,
          include: {
            customer: { select: { nama: true } },
            kavling: { select: { blok: true, nomorUnit: true } },
          },
        }),
      );
    }

    if (status === "PROSES_TODAY") {
      return this.mapPenjualanItems(
        await this.db.penjualan.findMany({
          where: {
            status: "PROSES",
            updatedAt: { gte: todayStart, lte: todayEnd },
          },
          orderBy: { updatedAt: "desc" },
          take: 50,
          include: {
            customer: { select: { nama: true } },
            kavling: { select: { blok: true, nomorUnit: true } },
          },
        }),
      );
    }

    if (status === "KPR") {
      return this.mapPenjualanItems(
        await this.db.penjualan.findMany({
          where: { caraPembayaran: "KPR", status: { not: "BATAL" } },
          orderBy: { createdAt: "desc" },
          take: 50,
          include: {
            customer: { select: { nama: true } },
            kavling: { select: { blok: true, nomorUnit: true } },
          },
        }),
      );
    }

    if (status === "CASH_BERTAHAP") {
      return this.mapPenjualanItems(
        await this.db.penjualan.findMany({
          where: { caraPembayaran: "CASH_BERTAHAP", status: { not: "BATAL" } },
          orderBy: { createdAt: "desc" },
          take: 50,
          include: {
            customer: { select: { nama: true } },
            kavling: { select: { blok: true, nomorUnit: true } },
          },
        }),
      );
    }

    const akadMonthFilter = this.parseYearMonthFilter(status, "AKAD");
    if (status === "AKAD_BULAN_INI" || akadMonthFilter) {
      const range = akadMonthFilter
        ? monthRange(akadMonthFilter.year, akadMonthFilter.month - 1)
        : { start: monthStartDate, end: monthEndDate };

      const akadDetails = await this.db.detailKavlingPajak.findMany({
        where: {
          tanggalAkadPpjb: { gte: range.start, lte: range.end },
          penjualan: { status: { not: "BATAL" } },
        },
        orderBy: { tanggalAkadPpjb: "desc" },
        take: 50,
        include: {
          penjualan: {
            include: {
              customer: { select: { nama: true } },
              kavling: { select: { blok: true, nomorUnit: true } },
            },
          },
        },
      });

      return akadDetails.map((d) => {
        const p = d.penjualan;
        return {
          id: p.noTransaksi,
          label: p.customer.nama,
          sublabel: `Blok ${p.kavling.blok} - ${p.kavling.nomorUnit}`,
          value: `Rp ${Number(p.hargaJual ?? 0).toLocaleString("id-ID")}`,
          status: d.tanggalAkadPpjb
            ? d.tanggalAkadPpjb.toISOString().substring(0, 10)
            : "Akad PPJB",
        };
      });
    }

    const cashMonthFilter = this.parseYearMonthFilter(status, "CASH");
    if (cashMonthFilter) {
      const { start, end } = monthRange(cashMonthFilter.year, cashMonthFilter.month - 1);
      return this.mapPenjualanItems(
        await this.db.penjualan.findMany({
          where: {
            caraPembayaran: { in: ["CASH_KERAS", "CASH_BERTAHAP"] },
            status: { not: "BATAL" },
            createdAt: { gte: start, lte: end },
          },
          orderBy: { createdAt: "desc" },
          take: 50,
          include: {
            customer: { select: { nama: true } },
            kavling: { select: { blok: true, nomorUnit: true } },
          },
        }),
      );
    }

    const penjualanBulanFilter = parsePenjualanBulanFilter(status);
    if (penjualanBulanFilter) {
      const { start, end } = monthRange(
        penjualanBulanFilter.year,
        penjualanBulanFilter.month - 1,
      );
      return this.mapPenjualanItems(
        await this.db.penjualan.findMany({
          where: {
            caraPembayaran: penjualanBulanFilter.caraPembayaran,
            status: { not: "BATAL" },
            createdAt: { gte: start, lte: end },
          },
          orderBy: { createdAt: "desc" },
          take: 50,
          include: {
            customer: { select: { nama: true } },
            kavling: { select: { blok: true, nomorUnit: true } },
          },
        }),
      );
    }

    const pemesananMonthFilter = this.parseYearMonthFilter(status, "PEMESANAN");
    if (pemesananMonthFilter) {
      const { start, end } = monthRange(
        pemesananMonthFilter.year,
        pemesananMonthFilter.month - 1,
      );
      return this.mapPenjualanItems(
        await this.db.penjualan.findMany({
          where: {
            status: { not: "BATAL" },
            createdAt: { gte: start, lte: end },
          },
          orderBy: { createdAt: "desc" },
          take: 50,
          include: {
            customer: { select: { nama: true } },
            kavling: { select: { blok: true, nomorUnit: true } },
          },
        }),
      );
    }

    const penjualan = await this.db.penjualan.findMany({
      where: status ? { status: status as "BOOKED" | "PROSES" | "LUNAS" | "BATAL" } : { status: { not: "BATAL" } },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        customer: { select: { nama: true } },
        kavling: { select: { blok: true, nomorUnit: true } },
      },
    });

    return this.mapPenjualanItems(penjualan);
  }

  private parseYearMonthFilter(
    filter: string | undefined,
    prefix: string,
  ): { year: number; month: number } | null {
    const match = filter?.match(new RegExp(`^${prefix}:(\\d{4}):(\\d{1,2})$`));
    if (!match) return null;
    const year = Number(match[1]);
    const month = Number(match[2]);
    if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
      return null;
    }
    return { year, month };
  }

  private mapPenjualanItems(
    penjualan: {
      noTransaksi: string;
      hargaJual: unknown;
      status: string;
      customer: { nama: string };
      kavling: { blok: string; nomorUnit: string };
    }[],
  ): DrilldownItemDTO[] {
    return penjualan.map((p) => ({
      id: p.noTransaksi,
      label: p.customer.nama,
      sublabel: `Blok ${p.kavling.blok} - ${p.kavling.nomorUnit}`,
      value: `Rp ${Number(p.hargaJual ?? 0).toLocaleString("id-ID")}`,
      status: PENJUALAN_STATUS_LABELS[p.status] ?? p.status,
    }));
  }

  private async drilldownTagihan(status?: string): Promise<DrilldownItemDTO[]> {
    const pendapatanFilter = parsePendapatanFilter(status);
    if (pendapatanFilter) {
      const { year, month } = pendapatanFilter;
      const { start, end } = monthRange(year, month - 1);

      const tagihan = await this.db.tagihan.findMany({
        where: {
          status: "LUNAS",
          isRefunded: false,
          jatuhTempo: { gte: start, lte: end },
        },
        orderBy: [{ jatuhTempo: "asc" }, { id: "asc" }],
        include: {
          customer: { select: { nama: true } },
          penjualan: {
            include: { kavling: { select: { blok: true, nomorUnit: true } } },
          },
        },
      });

      return tagihan.map((t) => ({
        id: t.noTagihan,
        label: t.customer.nama,
        sublabel: `Blok ${t.penjualan.kavling.blok} - ${t.penjualan.kavling.nomorUnit}`,
        pembayaran: t.pembayaran,
        value: `Rp ${Number(t.nominal).toLocaleString("id-ID")}`,
        status: t.jatuhTempo.toISOString().substring(0, 10),
        tanggalBayar: t.jatuhTempo.toISOString().substring(0, 10),
        buktiUrls: normalizeTagihanFileBuktiList(t.fileBuktiList, t.fileBukti),
      }));
    }

    const tagihan = await this.db.tagihan.findMany({
      where: status ? { status: status as "BELUM_BAYAR" | "MENUNGGU_KONFIRMASI" | "LUNAS" } : undefined,
      orderBy: { jatuhTempo: "desc" },
      take: 50,
      include: {
        customer: { select: { nama: true } },
        penjualan: {
          include: { kavling: { select: { blok: true, nomorUnit: true } } },
        },
      },
    });

    return tagihan.map((t) => ({
      id: t.noTagihan,
      label: t.customer.nama,
      sublabel: `Blok ${t.penjualan.kavling.blok} - ${t.penjualan.kavling.nomorUnit}`,
      value: `Rp ${Number(t.nominal).toLocaleString("id-ID")}`,
      status: TAGIHAN_STATUS_LABELS[t.status] ?? t.status,
    }));
  }

  private async drilldownProgress(range?: string): Promise<DrilldownItemDTO[]> {
    const progressList = await this.db.progressProyek.findMany({
      include: {
        kavling: { select: { blok: true, nomorUnit: true } },
        penjualan: { include: { customer: { select: { nama: true } } } },
        tahapan: { orderBy: { tanggal: "desc" }, take: 1 },
      },
    });

    const filtered = progressList.filter((prog) => {
      const pct = Number(prog.persentaseOverride ?? prog.persentase);
      return range ? progressInRange(pct, range) : true;
    });

    return filtered.slice(0, 50).map((prog) => {
      const pct = Number(prog.persentaseOverride ?? prog.persentase);
      const kavlingLabel = prog.kavling
        ? `Blok ${prog.kavling.blok} - ${prog.kavling.nomorUnit}`
        : "—";

      return {
        id: String(prog.id),
        label: kavlingLabel,
        sublabel: prog.penjualan?.customer?.nama ?? "—",
        value: `${pct}%`,
        status: prog.tahapan[0]?.namaTahapan ?? "Belum ada laporan",
      };
    });
  }
}
