import type { PrismaClient, TagihanTujuan } from "@prisma/client";
import { Prisma } from "@prisma/client";
import type { PaymentMethod } from "@prisma/client";
import type {
  PemasukanPenjualanBucketDTO,
  PemasukanPenjualanCicilanDTO,
  PemasukanPenjualanReportDTO,
  PemasukanPenjualanReportFilterDTO,
  PemasukanPenjualanReportItemDTO,
  PemasukanTerbayarDetailDTO,
} from "../../../domain/dtos/PemasukanPenjualanReportDTO.js";
import {
  effectiveTagihanTujuan,
  isCicilanHargaJualTagihan,
} from "../../../domain/tagihan/tagihanTujuan.js";
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

function extractCicilanOrder(pembayaran: string): number {
  const match = pembayaran.match(/(\d+)/);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
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
  hargaJual: Prisma.Decimal | null;
  dp: Prisma.Decimal | null;
  bookingFee: Prisma.Decimal | null;
  caraPembayaran: string | null;
  customer: { nama: string };
  kavling: {
    blok: string;
    nomorUnit: string;
    perumahan: { nama: string };
  };
  tagihan: TagihanRow[];
};

const penjualanSelect = {
  id: true,
  noTransaksi: true,
  hargaJual: true,
  dp: true,
  bookingFee: true,
  caraPembayaran: true,
  customer: { select: { nama: true } },
  kavling: {
    select: {
      blok: true,
      nomorUnit: true,
      perumahan: { select: { nama: true } },
    },
  },
  tagihan: {
    where: { isRefunded: false, status: "LUNAS" as const },
    orderBy: [{ jatuhTempo: "asc" as const }, { id: "asc" as const }],
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
} satisfies Prisma.PenjualanSelect;

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

function sortTagihanByCicilanOrder(tagihanList: TagihanRow[]): TagihanRow[] {
  return [...tagihanList].sort(
    (a, b) =>
      extractCicilanOrder(a.pembayaran) - extractCicilanOrder(b.pembayaran),
  );
}

function buildBucket(
  nominal: number,
  tagihanList: TagihanRow[],
): PemasukanPenjualanBucketDTO {
  const terbayar = sortTagihanByCicilanOrder(tagihanList).map(mapTerbayarDetail);
  const totalTerbayar = terbayar.reduce((sum, item) => sum + item.nominal, 0);
  return {
    nominal,
    terbayar,
    totalTerbayar,
    sisa: Math.max(0, nominal - totalTerbayar),
  };
}

function resolveBookingLunas(
  nominal: number,
  tagihanList: TagihanRow[],
): boolean | null {
  if (nominal <= 0) return null;
  const bucket = buildBucket(nominal, tagihanList);
  return bucket.totalTerbayar >= nominal;
}

function resolveSkemaPembayaran(
  caraPembayaran: string | null,
): string | null {
  if (caraPembayaran === "CASH_BERTAHAP") return "Bertahap";
  if (caraPembayaran === "KPR") return "KPR";
  return null;
}

function buildCicilanBucket(
  caraPembayaran: string | null,
  sisaPembayaran: number,
  cicilanTagihan: TagihanRow[],
): PemasukanPenjualanCicilanDTO {
  const skemaPembayaran = resolveSkemaPembayaran(caraPembayaran);
  if (!skemaPembayaran) {
    return {
      skemaPembayaran: null,
      nominal: 0,
      terbayar: [],
      totalTerbayar: 0,
      sisa: 0,
    };
  }
  return {
    skemaPembayaran,
    ...buildBucket(sisaPembayaran, cicilanTagihan),
  };
}

function mapPenjualanRowToItem(row: PenjualanRow): PemasukanPenjualanReportItemDTO {
  const hargaJual = Number(row.hargaJual ?? 0);
  const dp = Number(row.dp ?? 0);
  const bookingNominal = Number(row.bookingFee ?? 0);
  const sisaPembayaran = Math.max(0, hargaJual - dp);
  const lunasTagihan = row.tagihan;

  const bookingTagihan = lunasTagihan.filter(
    (t) => effectiveTagihanTujuan(t) === "BOOKING_FEE",
  );
  const dpTagihan = lunasTagihan.filter(
    (t) => effectiveTagihanTujuan(t) === "DP",
  );
  const cicilanTagihan = lunasTagihan.filter((t) =>
    isCicilanHargaJualTagihan(t),
  );

  return {
    penjualanId: row.id,
    noTransaksi: row.noTransaksi,
    customerNama: row.customer.nama,
    kavlingLabel: `${row.kavling.blok}-${row.kavling.nomorUnit}`,
    blok: row.kavling.blok,
    nomorUnit: row.kavling.nomorUnit,
    perumahanNama: row.kavling.perumahan.nama,
    caraPembayaran: row.caraPembayaran as PaymentMethod | null,
    hargaJual,
    bookingLunas: resolveBookingLunas(bookingNominal, bookingTagihan),
    dp: buildBucket(dp, dpTagihan),
    cicilan: buildCicilanBucket(
      row.caraPembayaran,
      sisaPembayaran,
      cicilanTagihan,
    ),
  };
}

type SummarySourceRow = {
  hargaJual: Prisma.Decimal | null;
  dp: Prisma.Decimal | null;
  bookingFee: Prisma.Decimal | null;
  caraPembayaran: string | null;
  tagihan: TagihanRow[];
};

function buildSummary(rows: SummarySourceRow[]) {
  return rows.reduce(
    (acc, row) => {
      const item = mapPenjualanRowToItem({
        id: 0,
        noTransaksi: "",
        hargaJual: row.hargaJual,
        dp: row.dp,
        bookingFee: row.bookingFee,
        caraPembayaran: row.caraPembayaran,
        customer: { nama: "" },
        kavling: {
          blok: "",
          nomorUnit: "",
          perumahan: { nama: "" },
        },
        tagihan: row.tagihan,
      });

      const bookingNominal = Number(row.bookingFee ?? 0);
      const bookingTagihan = row.tagihan.filter(
        (t) => effectiveTagihanTujuan(t) === "BOOKING_FEE",
      );
      const bookingTerbayar = buildBucket(bookingNominal, bookingTagihan).totalTerbayar;

      return {
        totalBookingNominal: acc.totalBookingNominal + bookingNominal,
        totalBookingTerbayar: acc.totalBookingTerbayar + bookingTerbayar,
        totalDpNominal: acc.totalDpNominal + item.dp.nominal,
        totalDpTerbayar: acc.totalDpTerbayar + item.dp.totalTerbayar,
        totalCicilanNominal: acc.totalCicilanNominal + item.cicilan.nominal,
        totalCicilanTerbayar: acc.totalCicilanTerbayar + item.cicilan.totalTerbayar,
      };
    },
    {
      totalBookingNominal: 0,
      totalBookingTerbayar: 0,
      totalDpNominal: 0,
      totalDpTerbayar: 0,
      totalCicilanNominal: 0,
      totalCicilanTerbayar: 0,
    },
  );
}

function buildPenjualanWhere(
  filters: PemasukanPenjualanReportFilterDTO,
  perumahanId?: number,
): Prisma.PenjualanWhereInput {
  const start = parseDateStart(filters.startDate);
  const end = parseDateEnd(filters.endDate);

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

  return penjualanWhere;
}

export class GetPemasukanPenjualanReportUseCase {
  constructor(private readonly db: PrismaClient) {}

  async execute(
    filters: PemasukanPenjualanReportFilterDTO,
  ): Promise<PemasukanPenjualanReportDTO> {
    const perumahanId = toOptionalInt(filters.perumahanId);
    const penjualanWhere = buildPenjualanWhere(filters, perumahanId);

    const page = filters.page && filters.page > 0 ? filters.page : 1;
    const limit = filters.limit && filters.limit > 0 ? filters.limit : 10;

    const totalItems = await this.db.penjualan.count({ where: penjualanWhere });
    const totalPages = Math.max(1, Math.ceil(totalItems / limit));
    const safePage = Math.min(page, totalPages);
    const skip = (safePage - 1) * limit;

    const [rows, summaryRows] = await Promise.all([
      this.db.penjualan.findMany({
        where: penjualanWhere,
        orderBy: [{ kavling: { blok: "asc" } }, { kavling: { nomorUnit: "asc" } }],
        skip,
        take: limit,
        select: penjualanSelect,
      }),
      this.db.penjualan.findMany({
        where: penjualanWhere,
        select: {
          hargaJual: true,
          dp: true,
          bookingFee: true,
          caraPembayaran: true,
          tagihan: {
            where: { isRefunded: false, status: "LUNAS" },
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
      }),
    ]);

    const items = rows.map((row) => mapPenjualanRowToItem(row as PenjualanRow));
    const summaryTotals = buildSummary(
      summaryRows.map((row) => ({
        hargaJual: row.hargaJual,
        dp: row.dp,
        bookingFee: row.bookingFee,
        caraPembayaran: row.caraPembayaran,
        tagihan: row.tagihan as TagihanRow[],
      })),
    );

    return {
      filters: { ...filters, page: safePage, limit },
      summary: {
        jumlahPenjualan: totalItems,
        ...summaryTotals,
      },
      items,
      meta: {
        page: safePage,
        limit,
        totalItems,
        totalPages,
      },
    };
  }
}
