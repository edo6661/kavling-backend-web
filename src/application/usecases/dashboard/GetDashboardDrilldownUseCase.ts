import type { PrismaClient } from "@prisma/client";
import type {
  DashboardDrilldownQueryDTO,
  DrilldownItemDTO,
} from "../../../domain/dtos/DashboardDTO.js";

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
    const penjualan = await this.db.penjualan.findMany({
      where: status ? { status: status as "BOOKED" | "PROSES" | "LUNAS" | "BATAL" } : { status: { not: "BATAL" } },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        customer: { select: { nama: true } },
        kavling: { select: { blok: true, nomorUnit: true } },
      },
    });

    return penjualan.map((p) => ({
      id: p.noTransaksi,
      label: p.customer.nama,
      sublabel: `Blok ${p.kavling.blok} - ${p.kavling.nomorUnit}`,
      value: `Rp ${Number(p.hargaJual ?? 0).toLocaleString("id-ID")}`,
      status: PENJUALAN_STATUS_LABELS[p.status] ?? p.status,
    }));
  }

  private async drilldownTagihan(status?: string): Promise<DrilldownItemDTO[]> {
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
