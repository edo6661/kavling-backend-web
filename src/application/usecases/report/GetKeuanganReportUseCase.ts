import type { PrismaClient } from "@prisma/client";
import type {
  KeuanganReportDTO,
  KeuanganReportFilterDTO,
  KeuanganPengeluaranItemDTO,
  KeuanganArusKasBulanDTO,
} from "../../../domain/dtos/KeuanganReportDTO.js";
import { SPK_PEMBAYARAN_JENIS_LABEL } from "../../../domain/spk/spkPembayaranCalc.js";

const NOTARIS_JENIS_LABEL: Record<string, string> = {
  BIAYA_NOTARIS: "Biaya Notaris",
  BPHTB: "BPHTB",
};

const KPR_JENIS_LABEL: Record<string, string> = {
  BIAYA_KPR: "Biaya KPR",
  BIAYA_APPRAISAL: "Biaya Appraisal",
};

const TUJUAN_LABEL: Record<string, string> = {
  BOOKING_FEE: "Booking Fee",
  DP: "DP",
  HARGA_JUAL: "Harga Jual",
  LAINNYA: "Lainnya",
};

const BULAN_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

function toIsoDate(value: Date | null | undefined): string | null {
  if (!value) return null;
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

function inDateRange(
  date: Date | null | undefined,
  start?: Date,
  end?: Date,
): boolean {
  if (!date) return !start && !end;
  if (start && date < start) return false;
  if (end && date > end) return false;
  return true;
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string): string {
  const [y, m] = key.split("-");
  const idx = Number(m) - 1;
  return `${BULAN_NAMES[idx]} ${y}`;
}

function matchesBsiFilter(
  dilaporkan: boolean,
  filter?: KeuanganReportFilterDTO["bsiCms"],
): boolean {
  if (!filter || filter === "ALL") return true;
  if (filter === "SUDAH") return dilaporkan;
  return !dilaporkan;
}

export class GetKeuanganReportUseCase {
  constructor(private readonly db: PrismaClient) {}

  async execute(filters: KeuanganReportFilterDTO): Promise<KeuanganReportDTO> {
    const start = parseDateStart(filters.startDate);
    const end = parseDateEnd(filters.endDate);
    const kategori = filters.kategori ?? "ALL";
    const statusFilter = filters.status ?? "ALL";

    const includeMasuk = kategori === "ALL" || kategori === "MASUK";
    const includeSpk = kategori === "ALL" || kategori === "SPK";
    const includeNotaris = kategori === "ALL" || kategori === "NOTARIS";
    const includeKpr = kategori === "ALL" || kategori === "KPR";

    const pemasukan: KeuanganReportDTO["pemasukan"] = [];
    const pengeluaran: KeuanganPengeluaranItemDTO[] = [];

    let totalMasuk = 0;
    let spkKeluar = 0;
    let notarisKeluar = 0;
    let kprKeluar = 0;
    let totalMenungguKeluar = 0;
    let bsiCmsSudahDilaporkan = 0;
    let bsiCmsBelumDilaporkan = 0;

    const arusMap = new Map<string, { masuk: number; keluar: number }>();

    const addArus = (key: string, masuk = 0, keluar = 0) => {
      const row = arusMap.get(key) ?? { masuk: 0, keluar: 0 };
      row.masuk += masuk;
      row.keluar += keluar;
      arusMap.set(key, row);
    };

    if (includeMasuk) {
      const tagihanRows = await this.db.tagihan.findMany({
        where: {
          isRefunded: false,
          status: "LUNAS",
          ...(start || end
            ? {
                updatedAt: {
                  ...(start ? { gte: start } : {}),
                  ...(end ? { lte: end } : {}),
                },
              }
            : {}),
        },
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          noTagihan: true,
          nominal: true,
          tujuan: true,
          updatedAt: true,
          customer: { select: { nama: true } },
          penjualan: {
            select: {
              kavling: { select: { blok: true, nomorUnit: true } },
            },
          },
        },
      });

      for (const t of tagihanRows) {
        const nominal = Number(t.nominal);
        totalMasuk += nominal;
        addArus(monthKey(t.updatedAt), nominal, 0);
        pemasukan.push({
          id: t.id,
          kategori: "TAGIHAN",
          noTagihan: t.noTagihan,
          nominal,
          tujuan: t.tujuan,
          tujuanLabel: TUJUAN_LABEL[t.tujuan] ?? t.tujuan,
          tanggalLunas: toIsoDate(t.updatedAt) ?? "",
          customerNama: t.customer.nama,
          kavlingLabel: `Blok ${t.penjualan.kavling.blok} No. ${t.penjualan.kavling.nomorUnit}`,
        });
      }
    }

    const trackBsi = (dilaporkan: boolean, status: string) => {
      if (status !== "SUDAH_DIBAYAR") return;
      if (dilaporkan) bsiCmsSudahDilaporkan++;
      else bsiCmsBelumDilaporkan++;
    };

    if (includeSpk) {
      const spkRows = await this.db.spkPembayaran.findMany({
        where: {
          status: { not: "DRAFT" },
          ...(statusFilter !== "ALL" ? { status: statusFilter } : {}),
        },
        orderBy: { tanggalPembayaran: "desc" },
        select: {
          id: true,
          jenis: true,
          nominal: true,
          status: true,
          tanggalPembayaran: true,
          bsiCmsDilaporkan: true,
          createdAt: true,
          spk: { select: { noSpk: true, judulPekerjaan: true } },
        },
      });

      for (const row of spkRows) {
        if (!matchesBsiFilter(row.bsiCmsDilaporkan, filters.bsiCms)) continue;

        const payDate = row.tanggalPembayaran ?? row.createdAt;
        if (!inDateRange(payDate, start, end) && row.status === "SUDAH_DIBAYAR") {
          if (start || end) continue;
        }
        if (
          row.status !== "SUDAH_DIBAYAR" &&
          (start || end) &&
          !inDateRange(row.createdAt, start, end)
        ) {
          continue;
        }

        const nominal = Number(row.nominal);
        trackBsi(row.bsiCmsDilaporkan, row.status);

        if (row.status === "SUDAH_DIBAYAR") {
          spkKeluar += nominal;
          if (row.tanggalPembayaran) {
            addArus(monthKey(row.tanggalPembayaran), 0, nominal);
          }
        } else {
          totalMenungguKeluar += nominal;
        }

        pengeluaran.push({
          id: row.id,
          kategori: "SPK",
          jenis: row.jenis,
          jenisLabel: SPK_PEMBAYARAN_JENIS_LABEL[row.jenis],
          nominal,
          status: row.status,
          tanggalPembayaran: toIsoDate(row.tanggalPembayaran),
          bsiCmsDilaporkan: row.bsiCmsDilaporkan,
          referensi: row.spk.noSpk,
          sublabel: row.spk.judulPekerjaan,
        });
      }
    }

    if (includeNotaris) {
      const notarisRows = await this.db.notarisPembayaran.findMany({
        where: {
          ...(statusFilter !== "ALL" ? { status: statusFilter } : {}),
        },
        orderBy: { tanggalPembayaran: "desc" },
        select: {
          id: true,
          jenis: true,
          nominal: true,
          status: true,
          tanggalPembayaran: true,
          bsiCmsDilaporkan: true,
          createdAt: true,
          penjualan: {
            select: {
              noTransaksi: true,
              customer: { select: { nama: true } },
              kavling: { select: { blok: true, nomorUnit: true } },
            },
          },
        },
      });

      for (const row of notarisRows) {
        if (!matchesBsiFilter(row.bsiCmsDilaporkan, filters.bsiCms)) continue;

        const payDate = row.tanggalPembayaran ?? row.createdAt;
        if (row.status === "SUDAH_DIBAYAR" && (start || end) && !inDateRange(payDate, start, end)) {
          continue;
        }
        if (
          row.status === "MENUNGGU_PEMBAYARAN" &&
          (start || end) &&
          !inDateRange(row.createdAt, start, end)
        ) {
          continue;
        }

        const nominal = Number(row.nominal);
        trackBsi(row.bsiCmsDilaporkan, row.status);

        if (row.status === "SUDAH_DIBAYAR") {
          notarisKeluar += nominal;
          if (row.tanggalPembayaran) {
            addArus(monthKey(row.tanggalPembayaran), 0, nominal);
          }
        } else {
          totalMenungguKeluar += nominal;
        }

        pengeluaran.push({
          id: row.id,
          kategori: "NOTARIS",
          jenis: row.jenis,
          jenisLabel: NOTARIS_JENIS_LABEL[row.jenis] ?? row.jenis,
          nominal,
          status: row.status,
          tanggalPembayaran: toIsoDate(row.tanggalPembayaran),
          bsiCmsDilaporkan: row.bsiCmsDilaporkan,
          referensi: row.penjualan.noTransaksi,
          sublabel: `${row.penjualan.customer.nama} · Blok ${row.penjualan.kavling.blok}`,
        });
      }
    }

    if (includeKpr) {
      const kprRows = await this.db.bankKprPembayaran.findMany({
        where: {
          ...(statusFilter !== "ALL" ? { status: statusFilter } : {}),
        },
        orderBy: { tanggalPembayaran: "desc" },
        select: {
          id: true,
          jenis: true,
          nominal: true,
          status: true,
          tanggalPembayaran: true,
          bsiCmsDilaporkan: true,
          createdAt: true,
          penjualan: {
            select: {
              noTransaksi: true,
              customer: { select: { nama: true } },
              kavling: { select: { blok: true, nomorUnit: true } },
            },
          },
        },
      });

      for (const row of kprRows) {
        if (!matchesBsiFilter(row.bsiCmsDilaporkan, filters.bsiCms)) continue;

        const payDate = row.tanggalPembayaran ?? row.createdAt;
        if (row.status === "SUDAH_DIBAYAR" && (start || end) && !inDateRange(payDate, start, end)) {
          continue;
        }
        if (
          row.status === "MENUNGGU_PEMBAYARAN" &&
          (start || end) &&
          !inDateRange(row.createdAt, start, end)
        ) {
          continue;
        }

        const nominal = Number(row.nominal);
        trackBsi(row.bsiCmsDilaporkan, row.status);

        if (row.status === "SUDAH_DIBAYAR") {
          kprKeluar += nominal;
          if (row.tanggalPembayaran) {
            addArus(monthKey(row.tanggalPembayaran), 0, nominal);
          }
        } else {
          totalMenungguKeluar += nominal;
        }

        pengeluaran.push({
          id: row.id,
          kategori: "KPR",
          jenis: row.jenis,
          jenisLabel: KPR_JENIS_LABEL[row.jenis] ?? row.jenis,
          nominal,
          status: row.status,
          tanggalPembayaran: toIsoDate(row.tanggalPembayaran),
          bsiCmsDilaporkan: row.bsiCmsDilaporkan,
          referensi: row.penjualan.noTransaksi,
          sublabel: `${row.penjualan.customer.nama} · Blok ${row.penjualan.kavling.blok}`,
        });
      }
    }

    const totalKeluar = spkKeluar + notarisKeluar + kprKeluar;

    const byKategori = [
      {
        kategori: "SPK",
        label: "Pembayaran SPK",
        sudahDibayar: spkKeluar,
        menungguPembayaran: pengeluaran
          .filter((p) => p.kategori === "SPK" && p.status !== "SUDAH_DIBAYAR")
          .reduce((s, p) => s + p.nominal, 0),
        bsiBelumDilaporkan: pengeluaran.filter(
          (p) => p.kategori === "SPK" && p.status === "SUDAH_DIBAYAR" && !p.bsiCmsDilaporkan,
        ).length,
      },
      {
        kategori: "NOTARIS",
        label: "Pembayaran Notaris",
        sudahDibayar: notarisKeluar,
        menungguPembayaran: pengeluaran
          .filter((p) => p.kategori === "NOTARIS" && p.status !== "SUDAH_DIBAYAR")
          .reduce((s, p) => s + p.nominal, 0),
        bsiBelumDilaporkan: pengeluaran.filter(
          (p) =>
            p.kategori === "NOTARIS" &&
            p.status === "SUDAH_DIBAYAR" &&
            !p.bsiCmsDilaporkan,
        ).length,
      },
      {
        kategori: "KPR",
        label: "Pembayaran Bank KPR",
        sudahDibayar: kprKeluar,
        menungguPembayaran: pengeluaran
          .filter((p) => p.kategori === "KPR" && p.status !== "SUDAH_DIBAYAR")
          .reduce((s, p) => s + p.nominal, 0),
        bsiBelumDilaporkan: pengeluaran.filter(
          (p) => p.kategori === "KPR" && p.status === "SUDAH_DIBAYAR" && !p.bsiCmsDilaporkan,
        ).length,
      },
    ].filter((row) => {
      if (kategori === "ALL") return true;
      if (kategori === "MASUK") return false;
      return row.kategori === kategori;
    });

    const arusKasBulanan: KeuanganArusKasBulanDTO[] = [...arusMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([bulan, data]) => ({
        bulan,
        bulanLabel: monthLabel(bulan),
        masuk: data.masuk,
        keluar: data.keluar,
      }));

    return {
      filters,
      summary: {
        totalMasuk,
        totalKeluar,
        totalMenungguKeluar,
        spkKeluar,
        notarisKeluar,
        kprKeluar,
        bsiCmsSudahDilaporkan,
        bsiCmsBelumDilaporkan,
        arusKasBersih: totalMasuk - totalKeluar,
      },
      arusKasBulanan,
      byKategori,
      pengeluaran,
      pemasukan,
    };
  }
}
