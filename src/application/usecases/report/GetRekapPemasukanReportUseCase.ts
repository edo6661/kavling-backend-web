import type { PaymentMethod, PrismaClient, TagihanTujuan } from "@prisma/client";
import { Prisma } from "@prisma/client";
import type {
  RekapPemasukanDetailItemDTO,
  RekapPemasukanKategoriDTO,
  RekapPemasukanReportDTO,
  RekapPemasukanReportFilterDTO,
  RekapPemasukanSkemaDTO,
} from "../../../domain/dtos/RekapPemasukanReportDTO.js";
import {
  effectiveTagihanTujuan,
  isCicilanHargaJualTagihan,
} from "../../../domain/tagihan/tagihanTujuan.js";
import { parseDpSequenceFromPembayaran } from "../../../domain/tagihan/noTagihan.js";

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

function isCicilanDpPembayaran(pembayaran: string): boolean {
  const seq = parseDpSequenceFromPembayaran(pembayaran);
  if (seq == null) return false;
  return /cicilan/i.test(pembayaran);
}

type TagihanRow = {
  nominal: unknown;
  tujuan: TagihanTujuan;
  pembayaran: string;
};

type PenjualanRow = {
  id: number;
  noTransaksi: string;
  caraPembayaran: string | null;
  bank: string | null;
  customer: { nama: string };
  kavling: {
    blok: string;
    nomorUnit: string;
    perumahan: { nama: string };
  };
  detailKavlingPajak: { pembiayaan: string | null } | null;
  tagihan: TagihanRow[];
};

type Accumulator = {
  bookingFee: number;
  dp: number;
  cicilanCashBertahap: number;
  dpKpr: number;
  cicilanKpr: number;
  cicilanDp: number;
  cicilanRumah: number;
};

function emptyAccumulator(): Accumulator {
  return {
    bookingFee: 0,
    dp: 0,
    cicilanCashBertahap: 0,
    dpKpr: 0,
    cicilanKpr: 0,
    cicilanDp: 0,
    cicilanRumah: 0,
  };
}

function accumulateTagihan(
  acc: Accumulator,
  tagihan: TagihanRow,
  caraPembayaran: string | null,
): void {
  const nominal = Number(tagihan.nominal);
  if (!Number.isFinite(nominal) || nominal <= 0) return;

  const tujuan = effectiveTagihanTujuan(tagihan);

  if (tujuan === "BOOKING_FEE") {
    acc.bookingFee += nominal;
    return;
  }

  if (tujuan === "DP") {
    const isCicilanDp = isCicilanDpPembayaran(tagihan.pembayaran);
    if (caraPembayaran === "KPR") {
      acc.dpKpr += nominal;
      acc.dp += nominal;
      return;
    }
    if (caraPembayaran === "CASH_BERTAHAP" && isCicilanDp) {
      acc.cicilanDp += nominal;
      return;
    }
    acc.dp += nominal;
    return;
  }

  if (isCicilanHargaJualTagihan(tagihan)) {
    if (caraPembayaran === "KPR") {
      acc.cicilanKpr += nominal;
      return;
    }
    if (caraPembayaran === "CASH_BERTAHAP") {
      acc.cicilanRumah += nominal;
      acc.cicilanCashBertahap += nominal;
    }
  }
}

function sumAccumulator(acc: Accumulator): number {
  return (
    acc.bookingFee +
    acc.dp +
    acc.cicilanCashBertahap +
    acc.cicilanKpr
  );
}

function kategori(
  key: string,
  label: string,
  terbayar: number | null,
  calculable: boolean,
  note?: string,
): RekapPemasukanKategoriDTO {
  return { key, label, terbayar, calculable, ...(note ? { note } : {}) };
}

function buildSkemaKpr(totals: Accumulator): RekapPemasukanSkemaDTO {
  return {
    dp: kategori("dpKpr", "DP KPR", totals.dpKpr, true),
    cicilan: kategori("pencairanKpr", "Pencairan KPR", totals.cicilanKpr, true),
  };
}

function buildSkemaCashBertahap(totals: Accumulator): RekapPemasukanSkemaDTO {
  return {
    dp: kategori(
      "dpCashBertahap",
      "DP (non-cicilan)",
      Math.max(0, totals.dp - totals.dpKpr),
      true,
      "DP awal cash bertahap (bukan cicilan DP)",
    ),
    cicilan: kategori(
      "cicilanCashBertahap",
      "Cicilan Cash Bertahap",
      totals.cicilanCashBertahap,
      true,
    ),
    cicilanDp: kategori("cicilanDp", "Cicilan DP", totals.cicilanDp, true),
    cicilanRumah: kategori("cicilanRumah", "Cicilan Rumah", totals.cicilanRumah, true),
  };
}

function buildRingkasan(totals: Accumulator): RekapPemasukanKategoriDTO[] {
  return [
    kategori(
      "modalAwal",
      "Modal Awal",
      null,
      false,
      "Belum ada definisi kalkulasi modal awal",
    ),
    kategori(
      "pembiayaanBsi",
      "Pembiayaan BSI",
      null,
      false,
      "Belum ada definisi kalkulasi pembiayaan BSI",
    ),
    kategori(
      "pembiayaanBsg",
      "Pembiayaan BSG",
      null,
      false,
      "Belum ada definisi kalkulasi pembiayaan BSG",
    ),
    kategori("bookingFee", "Booking Fee", totals.bookingFee, true),
    kategori("dp", "DP", totals.dp, true),
    kategori(
      "pencairanKpr",
      "Pencairan KPR",
      totals.cicilanKpr,
      true,
    ),
    kategori(
      "cicilanCashBertahap",
      "Cicilan Cash Bertahap",
      totals.cicilanCashBertahap,
      true,
    ),
    kategori(
      "bagiHasilBank",
      "Bagi Hasil Bank",
      null,
      false,
      "Belum ada definisi kalkulasi bagi hasil bank",
    ),
  ];
}

function mapPenjualanToDetail(row: PenjualanRow): RekapPemasukanDetailItemDTO {
  const acc = emptyAccumulator();
  for (const t of row.tagihan) {
    accumulateTagihan(acc, t, row.caraPembayaran);
  }

  return {
    penjualanId: row.id,
    noTransaksi: row.noTransaksi,
    customerNama: row.customer.nama,
    kavlingLabel: `${row.kavling.blok}-${row.kavling.nomorUnit}`,
    caraPembayaran: row.caraPembayaran as PaymentMethod | null,
    pembiayaan: row.detailKavlingPajak?.pembiayaan ?? row.bank,
    bookingFee: acc.bookingFee,
    dp: acc.dp,
    cicilanCashBertahap: acc.cicilanCashBertahap,
    cicilanDp: acc.cicilanDp,
    cicilanRumah: acc.cicilanRumah,
    dpKpr: acc.dpKpr,
    cicilanKpr: acc.cicilanKpr,
    totalTerima: sumAccumulator(acc),
  };
}

function buildPenjualanWhere(
  filters: RekapPemasukanReportFilterDTO,
  perumahanId?: number,
): Prisma.PenjualanWhereInput {
  const start = parseDateStart(filters.startDate);
  const end = parseDateEnd(filters.endDate);

  const penjualanWhere: Prisma.PenjualanWhereInput = {
    ...(filters.status && filters.status !== "ALL"
      ? { status: filters.status }
      : { status: { not: "BATAL" } }),
    ...(filters.caraPembayaran ? { caraPembayaran: filters.caraPembayaran } : {}),
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
        { noTransaksi: { contains: filters.search } },
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

  return penjualanWhere;
}

export class GetRekapPemasukanReportUseCase {
  constructor(private readonly db: PrismaClient) {}

  async execute(
    filters: RekapPemasukanReportFilterDTO,
  ): Promise<RekapPemasukanReportDTO> {
    const perumahanId = toOptionalInt(filters.perumahanId);
    const penjualanWhere = buildPenjualanWhere(filters, perumahanId);

    const page = filters.page && filters.page > 0 ? filters.page : 1;
    const limit = filters.limit && filters.limit > 0 ? filters.limit : 25;

    const rows = await this.db.penjualan.findMany({
      where: penjualanWhere,
      orderBy: [{ kavling: { blok: "asc" } }, { kavling: { nomorUnit: "asc" } }],
      select: {
        id: true,
        noTransaksi: true,
        caraPembayaran: true,
        bank: true,
        customer: { select: { nama: true } },
        kavling: {
          select: {
            blok: true,
            nomorUnit: true,
            perumahan: { select: { nama: true } },
          },
        },
        detailKavlingPajak: { select: { pembiayaan: true } },
        tagihan: {
          where: { isRefunded: false, status: "LUNAS" },
          select: {
            nominal: true,
            tujuan: true,
            pembayaran: true,
          },
        },
      },
    });

    const totals = emptyAccumulator();
    const kprTotals = emptyAccumulator();
    const cashBertahapTotals = emptyAccumulator();

    const allItems = (rows as PenjualanRow[]).map((row) => {
      const acc = emptyAccumulator();
      for (const t of row.tagihan) {
        accumulateTagihan(acc, t, row.caraPembayaran);
      }

      for (const key of Object.keys(totals) as (keyof Accumulator)[]) {
        totals[key] += acc[key];
      }

      if (row.caraPembayaran === "KPR") {
        for (const key of Object.keys(kprTotals) as (keyof Accumulator)[]) {
          kprTotals[key] += acc[key];
        }
      }
      if (row.caraPembayaran === "CASH_BERTAHAP") {
        for (const key of Object.keys(cashBertahapTotals) as (keyof Accumulator)[]) {
          cashBertahapTotals[key] += acc[key];
        }
      }

      return mapPenjualanToDetail(row);
    });

    const totalItems = allItems.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / limit));
    const safePage = Math.min(page, totalPages);
    const startIndex = (safePage - 1) * limit;
    const paginatedItems = allItems.slice(startIndex, startIndex + limit);

    return {
      filters: { ...filters, page: safePage, limit },
      ringkasan: buildRingkasan(totals),
      kpr: buildSkemaKpr(kprTotals),
      cashBertahap: buildSkemaCashBertahap(cashBertahapTotals),
      totalTerima: sumAccumulator(totals),
      jumlahPenjualan: totalItems,
      items: paginatedItems,
      meta: {
        page: safePage,
        limit,
        totalItems,
        totalPages,
      },
    };
  }
}
