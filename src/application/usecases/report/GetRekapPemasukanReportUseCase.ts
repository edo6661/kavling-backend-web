import type { PaymentMethod, PrismaClient, TagihanTujuan } from "@prisma/client";
import { Prisma } from "@prisma/client";
import type {
  RekapPemasukanDetailItemDTO,
  RekapPemasukanKategoriDTO,
  RekapPemasukanKategoriKey,
  RekapPemasukanReportDTO,
  RekapPemasukanReportFilterDTO,
  RekapPemasukanSkemaDTO,
  RekapPemasukanTerbayarBucketsDTO,
  RekapPemasukanTerbayarDetailDTO,
} from "../../../domain/dtos/RekapPemasukanReportDTO.js";
import type { PemasukanTerbayarDetailDTO } from "../../../domain/dtos/PemasukanPenjualanReportDTO.js";
import {
  effectiveTagihanTujuan,
  isCicilanHargaJualTagihan,
} from "../../../domain/tagihan/tagihanTujuan.js";
import { parseDpSequenceFromPembayaran } from "../../../domain/tagihan/noTagihan.js";
import { normalizeTagihanFileBuktiList } from "../../../utils/tagihanBukti.js";

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
  id: number;
  noTagihan: string;
  nominal: unknown;
  tujuan: TagihanTujuan;
  pembayaran: string;
  jatuhTempo: Date;
  status: string;
  fileBukti: string | null;
  fileBuktiList: Prisma.JsonValue | null;
  updatedAt: Date;
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

function extractCicilanOrder(pembayaran: string): number {
  const match = pembayaran.match(/(\d+)/);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

function mapTerbayarDetail(tagihan: TagihanRow): PemasukanTerbayarDetailDTO {
  const fileBuktiList = normalizeTagihanFileBuktiList(
    tagihan.fileBuktiList,
    tagihan.fileBukti,
  );
  return {
    tagihanId: tagihan.id,
    noTagihan: tagihan.noTagihan,
    nominal: Number(tagihan.nominal),
    pembayaran: tagihan.pembayaran,
    jatuhTempo: tagihan.jatuhTempo.toISOString(),
    status: tagihan.status,
    fileBukti: fileBuktiList[0] ?? tagihan.fileBukti,
    fileBuktiList,
    updatedAt: tagihan.updatedAt.toISOString(),
  };
}

function sortTerbayarDetails<T extends PemasukanTerbayarDetailDTO>(
  items: T[],
): T[] {
  return [...items].sort(
    (a, b) => extractCicilanOrder(a.pembayaran) - extractCicilanOrder(b.pembayaran),
  );
}

function emptyTerbayarBuckets(): RekapPemasukanTerbayarBucketsDTO {
  return {
    bookingFee: [],
    dp: [],
    cicilanCashBertahap: [],
    cicilanDp: [],
    cicilanRumah: [],
    dpKpr: [],
    cicilanKpr: [],
  };
}

function getTagihanCategories(
  tagihan: TagihanRow,
  caraPembayaran: string | null,
): RekapPemasukanKategoriKey[] {
  const nominal = Number(tagihan.nominal);
  if (!Number.isFinite(nominal) || nominal <= 0) return [];

  const tujuan = effectiveTagihanTujuan(tagihan);

  if (tujuan === "BOOKING_FEE") {
    return ["bookingFee"];
  }

  if (tujuan === "DP") {
    const isCicilanDp = isCicilanDpPembayaran(tagihan.pembayaran);
    if (caraPembayaran === "KPR") {
      return ["dpKpr", "dp"];
    }
    if (caraPembayaran === "CASH_BERTAHAP" && isCicilanDp) {
      return ["cicilanDp"];
    }
    if (caraPembayaran === "CASH_BERTAHAP" && !isCicilanDp) {
      return ["dp", "dpCashBertahap"];
    }
    return ["dp"];
  }

  if (isCicilanHargaJualTagihan(tagihan)) {
    if (caraPembayaran === "KPR") {
      return ["pencairanKpr", "cicilanKpr"];
    }
    if (caraPembayaran === "CASH_BERTAHAP") {
      return ["cicilanRumah", "cicilanCashBertahap"];
    }
  }

  return [];
}

function pushToBucket(
  buckets: RekapPemasukanTerbayarBucketsDTO,
  category: RekapPemasukanKategoriKey,
  detail: PemasukanTerbayarDetailDTO,
): void {
  switch (category) {
    case "bookingFee":
      buckets.bookingFee.push(detail);
      break;
    case "dp":
    case "dpCashBertahap":
      buckets.dp.push(detail);
      break;
    case "cicilanDp":
      buckets.cicilanDp.push(detail);
      break;
    case "pencairanKpr":
    case "cicilanKpr":
      buckets.cicilanKpr.push(detail);
      break;
    case "cicilanCashBertahap":
      buckets.cicilanCashBertahap.push(detail);
      break;
    case "cicilanRumah":
      buckets.cicilanRumah.push(detail);
      break;
    case "dpKpr":
      buckets.dpKpr.push(detail);
      break;
    default:
      break;
  }
}

function dedupeTerbayarDetails(
  items: PemasukanTerbayarDetailDTO[],
): PemasukanTerbayarDetailDTO[] {
  const seen = new Set<number>();
  const result: PemasukanTerbayarDetailDTO[] = [];
  for (const item of items) {
    if (seen.has(item.tagihanId)) continue;
    seen.add(item.tagihanId);
    result.push(item);
  }
  return sortTerbayarDetails(result);
}

function finalizeBuckets(
  buckets: RekapPemasukanTerbayarBucketsDTO,
): RekapPemasukanTerbayarBucketsDTO {
  return {
    bookingFee: sortTerbayarDetails(buckets.bookingFee),
    dp: dedupeTerbayarDetails(buckets.dp),
    cicilanCashBertahap: sortTerbayarDetails(buckets.cicilanCashBertahap),
    cicilanDp: sortTerbayarDetails(buckets.cicilanDp),
    cicilanRumah: sortTerbayarDetails(buckets.cicilanRumah),
    dpKpr: sortTerbayarDetails(buckets.dpKpr),
    cicilanKpr: dedupeTerbayarDetails(buckets.cicilanKpr),
  };
}

function buildTerbayarBuckets(
  tagihanList: TagihanRow[],
  caraPembayaran: string | null,
): RekapPemasukanTerbayarBucketsDTO {
  const buckets = emptyTerbayarBuckets();
  for (const tagihan of tagihanList) {
    const detail = mapTerbayarDetail(tagihan);
    for (const category of getTagihanCategories(tagihan, caraPembayaran)) {
      pushToBucket(buckets, category, detail);
    }
  }
  return finalizeBuckets(buckets);
}

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
    acc.cicilanDp +
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
      "DP",
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
    kategori("cicilanDp", "Cicilan DP", totals.cicilanDp, true),
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
      "Cicilan harga jual (cash bertahap)",
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

  const terbayar = buildTerbayarBuckets(row.tagihan, row.caraPembayaran);

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
    terbayar,
  };
}

function appendKategoriTerbayar(
  aggregate: Partial<Record<RekapPemasukanKategoriKey, RekapPemasukanTerbayarDetailDTO[]>>,
  category: RekapPemasukanKategoriKey,
  detail: RekapPemasukanTerbayarDetailDTO,
): void {
  if (!aggregate[category]) {
    aggregate[category] = [];
  }
  aggregate[category]!.push(detail);
}

function finalizeKategoriTerbayar(
  aggregate: Partial<Record<RekapPemasukanKategoriKey, RekapPemasukanTerbayarDetailDTO[]>>,
): Partial<Record<RekapPemasukanKategoriKey, RekapPemasukanTerbayarDetailDTO[]>> {
  const result: Partial<
    Record<RekapPemasukanKategoriKey, RekapPemasukanTerbayarDetailDTO[]>
  > = {};
  for (const [key, items] of Object.entries(aggregate)) {
    if (!items || items.length === 0) continue;
    result[key as RekapPemasukanKategoriKey] = sortTerbayarDetails(items);
  }
  return result;
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
          orderBy: [{ jatuhTempo: "asc" }, { id: "asc" }],
          select: {
            id: true,
            noTagihan: true,
            nominal: true,
            tujuan: true,
            pembayaran: true,
            jatuhTempo: true,
            status: true,
            fileBukti: true,
            fileBuktiList: true,
            updatedAt: true,
          },
        },
      },
    });

    const totals = emptyAccumulator();
    const kprTotals = emptyAccumulator();
    const cashBertahapTotals = emptyAccumulator();
    const kategoriTerbayar: Partial<
      Record<RekapPemasukanKategoriKey, RekapPemasukanTerbayarDetailDTO[]>
    > = {};

    const allItems = (rows as PenjualanRow[]).map((row) => {
      const acc = emptyAccumulator();
      const kavlingLabel = `${row.kavling.blok}-${row.kavling.nomorUnit}`;

      for (const t of row.tagihan) {
        accumulateTagihan(acc, t, row.caraPembayaran);

        const detail = mapTerbayarDetail(t);
        const withContext: RekapPemasukanTerbayarDetailDTO = {
          ...detail,
          penjualanId: row.id,
          noTransaksi: row.noTransaksi,
          customerNama: row.customer.nama,
          kavlingLabel,
        };
        for (const category of getTagihanCategories(t, row.caraPembayaran)) {
          appendKategoriTerbayar(kategoriTerbayar, category, withContext);
        }
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
      kategoriTerbayar: finalizeKategoriTerbayar(kategoriTerbayar),
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
