import type { PrismaClient } from "@prisma/client";
import { Prisma } from "@prisma/client";
import type {
  RekapPembayaranReportDTO,
  RekapPembayaranReportFilterDTO,
  RekapPembayaranReportItemDTO,
} from "../../../domain/dtos/RekapPembayaranReportDTO.js";
import {
  effectiveTagihanTujuan,
  isCicilanHargaJualTagihan,
} from "../../../domain/tagihan/tagihanTujuan.js";

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

function toOptionalInt(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : undefined;
}

function extractCicilanOrder(pembayaran: string): number {
  const match = pembayaran.match(/(\d+)/);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

function sortByCicilanOrder(
  items: { nominal: unknown; pembayaran: string }[],
): number[] {
  return [...items]
    .sort(
      (a, b) =>
        extractCicilanOrder(a.pembayaran) - extractCicilanOrder(b.pembayaran),
    )
    .map((item) => Number(item.nominal));
}

export class GetRekapPembayaranReportUseCase {
  constructor(private readonly db: PrismaClient) {}

  async execute(
    filters: RekapPembayaranReportFilterDTO,
  ): Promise<RekapPembayaranReportDTO> {
    const start = parseDateStart(filters.startDate);
    const end = parseDateEnd(filters.endDate);
    const perumahanId = toOptionalInt(filters.perumahanId);

    const penjualanWhere: Prisma.PenjualanWhereInput = {
      ...(filters.status && filters.status !== "ALL"
        ? { status: filters.status }
        : { status: { not: "BATAL" } }),
      ...(filters.caraPembayaran
        ? { caraPembayaran: filters.caraPembayaran }
        : {}),
      ...(perumahanId || filters.blok
        ? {
            kavling: {
              ...(perumahanId ? { perumahanId } : {}),
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

    if (filters.search) {
      const searchClause: Prisma.PenjualanWhereInput = {
        OR: [
          { customer: { nama: { contains: filters.search } } },
          { kavling: { blok: { contains: filters.search } } },
          { kavling: { nomorUnit: { contains: filters.search } } },
        ],
      };
      penjualanWhere.AND = [
        ...(Array.isArray(penjualanWhere.AND)
          ? penjualanWhere.AND
          : penjualanWhere.AND
            ? [penjualanWhere.AND]
            : []),
        searchClause,
      ];
    }

    const rows = await this.db.penjualan.findMany({
      where: penjualanWhere,
      orderBy: [{ kavling: { blok: "asc" } }, { kavling: { nomorUnit: "asc" } }],
      select: {
        id: true,
        noTransaksi: true,
        hargaJual: true,
        dp: true,
        customer: { select: { nama: true } },
        kavling: {
          select: {
            blok: true,
            nomorUnit: true,
            perumahan: { select: { nama: true } },
          },
        },
        tagihan: {
          where: { isRefunded: false, status: "LUNAS" },
          orderBy: [{ jatuhTempo: "asc" }, { id: "asc" }],
          select: {
            nominal: true,
            tujuan: true,
            pembayaran: true,
          },
        },
      },
    });

    let totalHargaJual = 0;
    let totalDp = 0;
    let totalSisaPembayaran = 0;
    let totalDpTerbayar = 0;
    let totalCicilanTerbayar = 0;

    const items: RekapPembayaranReportItemDTO[] = rows.map((row) => {
      const hargaJual = Number(row.hargaJual ?? 0);
      const dp = Number(row.dp ?? 0);
      const sisaPembayaran = Math.max(0, hargaJual - dp);

      const dpTagihan = row.tagihan.filter(
        (t) => effectiveTagihanTujuan(t) === "DP",
      );
      const cicilanTagihan = row.tagihan.filter((t) =>
        isCicilanHargaJualTagihan(t),
      );

      const dpTerbayar = sortByCicilanOrder(dpTagihan);
      const cicilanTerbayar = sortByCicilanOrder(cicilanTagihan);
      const itemTotalDpTerbayar = dpTerbayar.reduce((sum, n) => sum + n, 0);
      const itemTotalCicilanTerbayar = cicilanTerbayar.reduce(
        (sum, n) => sum + n,
        0,
      );

      totalHargaJual += hargaJual;
      totalDp += dp;
      totalSisaPembayaran += sisaPembayaran;
      totalDpTerbayar += itemTotalDpTerbayar;
      totalCicilanTerbayar += itemTotalCicilanTerbayar;

      return {
        penjualanId: row.id,
        noTransaksi: row.noTransaksi,
        customerNama: row.customer.nama,
        kavlingLabel: `${row.kavling.blok}-${row.kavling.nomorUnit}`,
        blok: row.kavling.blok,
        nomorUnit: row.kavling.nomorUnit,
        perumahanNama: row.kavling.perumahan.nama,
        hargaJual,
        dp,
        sisaPembayaran,
        dpTerbayar,
        cicilanTerbayar,
        totalDpTerbayar: itemTotalDpTerbayar,
        totalCicilanTerbayar: itemTotalCicilanTerbayar,
      };
    });

    const page = filters.page && filters.page > 0 ? filters.page : 1;
    const limit = filters.limit && filters.limit > 0 ? filters.limit : 10;
    const totalItems = items.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / limit));
    const startIndex = (page - 1) * limit;
    const paginatedItems = items.slice(startIndex, startIndex + limit);

    return {
      filters,
      summary: {
        jumlahPenjualan: totalItems,
        totalHargaJual,
        totalDp,
        totalSisaPembayaran,
        totalDpTerbayar,
        totalCicilanTerbayar,
      },
      items: paginatedItems,
      meta: {
        page,
        limit,
        totalItems,
        totalPages,
      },
    };
  }
}
