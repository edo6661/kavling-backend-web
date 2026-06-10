import type { PrismaClient } from "@prisma/client";
import { Prisma } from "@prisma/client";
import type {
  PenjualanReportDTO,
  PenjualanReportFilterDTO,
  PenjualanAgingBucketDTO,
} from "../../../domain/dtos/PenjualanReportDTO.js";

const TUJUAN_LABEL: Record<string, string> = {
  BOOKING_FEE: "Booking Fee",
  DP: "DP",
  HARGA_JUAL: "Harga Jual",
  LAINNYA: "Lainnya",
};

const STATUS_LABEL: Record<string, string> = {
  BOOKED: "Booked",
  PROSES: "Proses",
  LUNAS: "Lunas",
  BATAL: "Batal",
};

const AGING_BUCKETS = [
  { bucket: "belum_jatuh_tempo", label: "Belum Jatuh Tempo", min: -Infinity, max: -1 },
  { bucket: "1_30", label: "1–30 Hari", min: 0, max: 30 },
  { bucket: "31_60", label: "31–60 Hari", min: 31, max: 60 },
  { bucket: "61_90", label: "61–90 Hari", min: 61, max: 90 },
  { bucket: "90_plus", label: "> 90 Hari", min: 91, max: Infinity },
] as const;

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

function daysOverdue(jatuhTempo: Date, today: Date): number {
  const due = new Date(jatuhTempo);
  due.setHours(0, 0, 0, 0);
  const t = new Date(today);
  t.setHours(0, 0, 0, 0);
  return Math.floor((t.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
}

function resolveAgingBucket(days: number): string {
  if (days < 0) return "belum_jatuh_tempo";
  if (days <= 30) return "1_30";
  if (days <= 60) return "31_60";
  if (days <= 90) return "61_90";
  return "90_plus";
}

function isPiutang(status: string): boolean {
  return status === "BELUM_BAYAR" || status === "MENUNGGU_KONFIRMASI";
}

export class GetPenjualanReportUseCase {
  constructor(private readonly db: PrismaClient) {}

  async execute(filters: PenjualanReportFilterDTO): Promise<PenjualanReportDTO> {
    const start = parseDateStart(filters.startDate);
    const end = parseDateEnd(filters.endDate);
    const today = new Date();

    const penjualanWhere: Prisma.PenjualanWhereInput = {
      ...(filters.status && filters.status !== "ALL"
        ? { status: filters.status }
        : { status: { not: "BATAL" } }),
      ...(filters.caraPembayaran ? { caraPembayaran: filters.caraPembayaran } : {}),
      ...(filters.agentId ? { agentId: filters.agentId } : {}),
      ...(filters.perumahanId || filters.blok
        ? {
            kavling: {
              ...(filters.perumahanId ? { perumahanId: filters.perumahanId } : {}),
              ...(filters.blok ? { blok: filters.blok } : {}),
            },
          }
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

    const rows = await this.db.penjualan.findMany({
      where: penjualanWhere,
      orderBy: { tanggal: "desc" },
      select: {
        id: true,
        noTransaksi: true,
        tanggal: true,
        status: true,
        caraPembayaran: true,
        hargaJual: true,
        customer: { select: { nama: true } },
        agent: { select: { nama: true } },
        kavling: {
          select: {
            blok: true,
            nomorUnit: true,
            perumahan: { select: { nama: true } },
          },
        },
        tagihan: {
          where: { isRefunded: false },
          orderBy: { jatuhTempo: "asc" },
          select: {
            id: true,
            noTagihan: true,
            nominal: true,
            jatuhTempo: true,
            status: true,
            tujuan: true,
          },
        },
      },
    });

    const agingMap = new Map<string, PenjualanAgingBucketDTO>(
      AGING_BUCKETS.map((b) => [
        b.bucket,
        { bucket: b.bucket, label: b.label, jumlahTagihan: 0, totalNominal: 0 },
      ]),
    );

    const statusMap = new Map<string, { count: number; nominal: number }>();
    const blokMap = new Map<string, { count: number; nominal: number }>();

    let totalNilaiPenjualan = 0;
    let totalTerbayar = 0;
    let totalPiutang = 0;
    let tagihanJatuhTempo = 0;
    let tagihanMenungguKonfirmasi = 0;

    const items = rows.map((row) => {
      const hargaJual = Number(row.hargaJual ?? 0);
      totalNilaiPenjualan += hargaJual;

      let itemTerbayar = 0;
      let itemPiutang = 0;
      let lunasCount = 0;
      let belumCount = 0;

      const tagihan = row.tagihan.map((t) => {
        const nominal = Number(t.nominal);
        const overdue = daysOverdue(t.jatuhTempo, today);

        if (t.status === "LUNAS") {
          itemTerbayar += nominal;
          lunasCount++;
        } else if (isPiutang(t.status)) {
          itemPiutang += nominal;
          belumCount++;

          if (t.status === "MENUNGGU_KONFIRMASI") {
            tagihanMenungguKonfirmasi++;
          }
          if (t.status === "BELUM_BAYAR" && overdue > 0) {
            tagihanJatuhTempo++;
          }

          const bucketKey = resolveAgingBucket(overdue);
          const bucket = agingMap.get(bucketKey)!;
          bucket.jumlahTagihan++;
          bucket.totalNominal += nominal;
        }

        return {
          id: t.id,
          noTagihan: t.noTagihan,
          nominal,
          jatuhTempo: toIsoDate(t.jatuhTempo),
          status: t.status,
          tujuan: t.tujuan,
          tujuanLabel: TUJUAN_LABEL[t.tujuan] ?? t.tujuan,
          hariTerlambat: Math.max(0, overdue),
        };
      });

      totalTerbayar += itemTerbayar;
      totalPiutang += itemPiutang;

      const statusKey = row.status;
      const statusEntry = statusMap.get(statusKey) ?? { count: 0, nominal: 0 };
      statusEntry.count++;
      statusEntry.nominal += hargaJual;
      statusMap.set(statusKey, statusEntry);

      const blokKey = row.kavling.blok;
      const blokEntry = blokMap.get(blokKey) ?? { count: 0, nominal: 0 };
      blokEntry.count++;
      blokEntry.nominal += hargaJual;
      blokMap.set(blokKey, blokEntry);

      const totalTagihan = tagihan.reduce((s, t) => s + t.nominal, 0);

      return {
        penjualanId: row.id,
        noTransaksi: row.noTransaksi,
        tanggal: toIsoDate(row.tanggal),
        status: row.status,
        caraPembayaran: row.caraPembayaran,
        hargaJual,
        customerNama: row.customer.nama,
        agentNama: row.agent?.nama ?? null,
        kavlingLabel: `Blok ${row.kavling.blok} No. ${row.kavling.nomorUnit}`,
        blok: row.kavling.blok,
        nomorUnit: row.kavling.nomorUnit,
        perumahanNama: row.kavling.perumahan.nama,
        totalTagihan,
        totalTerbayar: itemTerbayar,
        totalPiutang: itemPiutang,
        persentaseTerbayar:
          totalTagihan > 0 ? Math.round((itemTerbayar / totalTagihan) * 100) : 0,
        jumlahTagihanLunas: lunasCount,
        jumlahTagihanBelum: belumCount,
        tagihan,
      };
    });

    const totalTagihanAll = totalTerbayar + totalPiutang;

    return {
      filters,
      summary: {
        jumlahPenjualan: items.length,
        totalNilaiPenjualan,
        totalTerbayar,
        totalPiutang,
        tagihanJatuhTempo,
        tagihanMenungguKonfirmasi,
        persentaseKoleksi:
          totalTagihanAll > 0
            ? Math.round((totalTerbayar / totalTagihanAll) * 100)
            : 0,
      },
      aging: AGING_BUCKETS.map((b) => agingMap.get(b.bucket)!),
      byStatus: [...statusMap.entries()].map(([status, data]) => ({
        status,
        label: STATUS_LABEL[status] ?? status,
        count: data.count,
        nominal: data.nominal,
      })),
      byBlok: [...blokMap.entries()]
        .map(([blok, data]) => ({
          blok,
          count: data.count,
          nominal: data.nominal,
        }))
        .sort((a, b) => a.blok.localeCompare(b.blok)),
      items,
    };
  }
}
