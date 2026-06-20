import type { PrismaClient, SpkPembayaranJenis } from "@prisma/client";
import { Prisma } from "@prisma/client";
import type {
  RekapPembayaranBucketDTO,
  RekapPembayaranReportDTO,
  RekapPembayaranReportFilterDTO,
  RekapPembayaranReportItemDTO,
} from "../../../domain/dtos/RekapPembayaranReportDTO.js";
import {
  effectiveTagihanTujuan,
  isCicilanHargaJualTagihan,
} from "../../../domain/tagihan/tagihanTujuan.js";
import {
  sumBiayaBphtb,
  sumBiayaPph,
  sumNilaiAjb,
} from "../../../domain/progressPenjualan/progressPenjualanSertifikatUtils.js";

const MATERIAL_JENIS: SpkPembayaranJenis[] = [
  "TERMIN_55",
  "TERMIN_100",
  "RETENSI",
  "KASBON",
];

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

function bucket(utama: number, terbayar: number[]): RekapPembayaranBucketDTO {
  return { utama, terbayar };
}

function sumTerbayar(items: number[]): number {
  return items.reduce((sum, n) => sum + n, 0);
}

function calcMarketingFees(
  nilaiAjb: number,
  feeMarketingPct: number,
  closingFeeUtama: number,
  potonganPphPct: number,
  feeAgent: {
    marketingNominal: Prisma.Decimal | null;
    marketingTanggal: Date | null;
    closingNominal: Prisma.Decimal | null;
    closingTanggal: Date | null;
  } | null,
) {
  const marketingFeeUtama =
    nilaiAjb > 0 && feeMarketingPct > 0
      ? nilaiAjb * (feeMarketingPct / 100)
      : 0;
  const closingFeeResolved =
    feeAgent?.closingNominal != null
      ? Number(feeAgent.closingNominal)
      : closingFeeUtama;
  const potonganPphUtama =
    (marketingFeeUtama + closingFeeResolved) * (potonganPphPct / 100);
  const netUtama = marketingFeeUtama + closingFeeResolved - potonganPphUtama;

  const marketingTerbayar =
    feeAgent?.marketingTanggal && feeAgent.marketingNominal
      ? [Number(feeAgent.marketingNominal)]
      : [];
  const closingTerbayar =
    feeAgent?.closingTanggal && feeAgent.closingNominal
      ? [Number(feeAgent.closingNominal)]
      : [];

  const marketingPaid = sumTerbayar(marketingTerbayar);
  const closingPaid = sumTerbayar(closingTerbayar);
  const potonganTerbayar =
    marketingPaid + closingPaid > 0
      ? [(marketingPaid + closingPaid) * (potonganPphPct / 100)]
      : [];
  const netTerbayar =
    marketingPaid + closingPaid > 0
      ? [marketingPaid + closingPaid - sumTerbayar(potonganTerbayar)]
      : [];

  return {
    marketingFee: bucket(marketingFeeUtama, marketingTerbayar),
    closingFee: bucket(closingFeeResolved, closingTerbayar),
    potonganPph: bucket(potonganPphUtama, potonganTerbayar),
    netSetelahPotonganPph: bucket(netUtama, netTerbayar),
  };
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
        bookingFee: true,
        caraPembayaran: true,
        customer: { select: { nama: true } },
        agent: {
          select: {
            feeMarketingPct: true,
            feeClosingNominal: true,
            potonganPph: true,
          },
        },
        feeAgent: {
          select: {
            marketingNominal: true,
            marketingTanggal: true,
            closingNominal: true,
            closingTanggal: true,
          },
        },
        biayaKpr: true,
        detailKavlingPajak: {
          select: {
            biayaNotaris: true,
            tanggalPembayaranPph: true,
            nrBiayaAppraisal: true,
            pjBiayaAppraisal: true,
          },
        },
        progressPenjualan: {
          select: {
            nilaiAjb: true,
            biayaBphtb: true,
            biayaPph: true,
            sertifikatTambahan: {
              select: {
                urutan: true,
                nilaiAjb: true,
                biayaBphtb: true,
                biayaPph: true,
              },
            },
          },
        },
        kodeBillingPph: {
          select: { status: true },
        },
        notarisPembayaranList: {
          select: { jenis: true, nominal: true, status: true },
        },
        bankKprPembayaranList: {
          select: { jenis: true, nominal: true, status: true },
        },
        kavling: {
          select: {
            blok: true,
            nomorUnit: true,
            perumahan: { select: { nama: true } },
            spkItem: {
              select: {
                spk: {
                  select: {
                    pembayaranList: {
                      select: { jenis: true, nominal: true, status: true },
                    },
                  },
                },
              },
            },
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
      const isKpr = row.caraPembayaran === "KPR";

      const bookingTagihan = row.tagihan.filter(
        (t) => effectiveTagihanTujuan(t) === "BOOKING_FEE",
      );
      const dpTagihan = row.tagihan.filter(
        (t) => effectiveTagihanTujuan(t) === "DP",
      );
      const cicilanTagihan = row.tagihan.filter((t) =>
        isCicilanHargaJualTagihan(t),
      );

      const bookingTerbayar = sortByCicilanOrder(bookingTagihan);
      const dpTerbayar = sortByCicilanOrder(dpTagihan);
      const cicilanTerbayar = sortByCicilanOrder(cicilanTagihan);

      const itemTotalDpTerbayar = dpTerbayar.reduce((sum, n) => sum + n, 0);
      const itemTotalCicilanTerbayar = cicilanTerbayar.reduce(
        (sum, n) => sum + n,
        0,
      );

      const progressUtama = row.progressPenjualan;
      const progressTambahan =
        progressUtama?.sertifikatTambahan.map((item) => ({
          urutan: item.urutan,
          nilaiAjb: item.nilaiAjb ? Number(item.nilaiAjb) : null,
          biayaBphtb: item.biayaBphtb ? Number(item.biayaBphtb) : null,
          biayaPph: item.biayaPph ? Number(item.biayaPph) : null,
        })) ?? [];
      const progressSlot = progressUtama
        ? {
            nilaiAjb: progressUtama.nilaiAjb
              ? Number(progressUtama.nilaiAjb)
              : null,
            biayaBphtb: progressUtama.biayaBphtb
              ? Number(progressUtama.biayaBphtb)
              : null,
            biayaPph: progressUtama.biayaPph
              ? Number(progressUtama.biayaPph)
              : null,
          }
        : null;

      const biayaNotarisUtama = row.detailKavlingPajak?.biayaNotaris
        ? Number(row.detailKavlingPajak.biayaNotaris)
        : 0;
      const biayaBphtbUtama = sumBiayaBphtb(progressSlot, progressTambahan);
      const biayaPphUtama = sumBiayaPph(progressSlot, progressTambahan);

      const notarisPaid = (jenis: "BIAYA_NOTARIS" | "BPHTB") =>
        row.notarisPembayaranList
          .filter((p) => p.jenis === jenis && p.status === "SUDAH_DIBAYAR")
          .map((p) => Number(p.nominal));

      const pphTerbayar =
        biayaPphUtama > 0 &&
        (row.detailKavlingPajak?.tanggalPembayaranPph != null ||
          row.kodeBillingPph.some((k) => k.status === "SUDAH_BAYAR"))
          ? [biayaPphUtama]
          : [];

      const resolveBiayaAppraisalUtama = () => {
        const detail = row.detailKavlingPajak;
        if (!detail) return 0;
        const nr = detail.nrBiayaAppraisal ? Number(detail.nrBiayaAppraisal) : 0;
        if (nr > 0) return nr;
        const pj = detail.pjBiayaAppraisal ? Number(detail.pjBiayaAppraisal) : 0;
        return pj > 0 ? pj : 0;
      };

      const bankBucket = (jenis: "BIAYA_KPR" | "BIAYA_APPRAISAL") => {
        const rowItem = row.bankKprPembayaranList.find((p) => p.jenis === jenis);
        const fallbackUtama =
          jenis === "BIAYA_KPR"
            ? row.biayaKpr
              ? Number(row.biayaKpr)
              : 0
            : resolveBiayaAppraisalUtama();
        const utama = rowItem ? Number(rowItem.nominal) : fallbackUtama;
        const terbayar =
          rowItem?.status === "SUDAH_DIBAYAR" ? [Number(rowItem.nominal)] : [];
        return bucket(utama, terbayar);
      };

      const spkPembayaran =
        row.kavling.spkItem?.spk.pembayaranList ?? [];

      const materialRows = spkPembayaran.filter((p) =>
        MATERIAL_JENIS.includes(p.jenis),
      );
      const upahRows = spkPembayaran.filter((p) => p.jenis === "UPAH");

      const materialUtama = materialRows.reduce(
        (sum, p) => sum + Number(p.nominal),
        0,
      );
      const materialTerbayar = materialRows
        .filter((p) => p.status === "SUDAH_DIBAYAR")
        .map((p) => Number(p.nominal));

      const upahUtama = upahRows.reduce(
        (sum, p) => sum + Number(p.nominal),
        0,
      );
      const upahTerbayar = upahRows
        .filter((p) => p.status === "SUDAH_DIBAYAR")
        .map((p) => Number(p.nominal));

      const nilaiAjb = sumNilaiAjb(progressSlot, progressTambahan);
      const feeMarketingPct = row.agent?.feeMarketingPct
        ? Number(row.agent.feeMarketingPct)
        : 0;
      const closingFeeUtama = row.agent?.feeClosingNominal
        ? Number(row.agent.feeClosingNominal)
        : 0;
      const potonganPphPct = row.agent?.potonganPph
        ? Number(row.agent.potonganPph)
        : 0;

      const marketing = calcMarketingFees(
        nilaiAjb,
        feeMarketingPct,
        closingFeeUtama,
        potonganPphPct,
        row.feeAgent,
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
        pemasukan: {
          booking: bucket(Number(row.bookingFee ?? 0), bookingTerbayar),
          dp: bucket(dp, dpTerbayar),
          cicilanCashBertahap: bucket(
            isKpr ? 0 : sisaPembayaran,
            isKpr ? [] : cicilanTerbayar,
          ),
          cicilanPencairanKpr: bucket(
            isKpr ? sisaPembayaran : 0,
            isKpr ? cicilanTerbayar : [],
          ),
        },
        pengeluaranNotaris: {
          biayaNotaris: bucket(biayaNotarisUtama, notarisPaid("BIAYA_NOTARIS")),
          bphtb: bucket(biayaBphtbUtama, notarisPaid("BPHTB")),
          pph: bucket(biayaPphUtama, pphTerbayar),
        },
        pengeluaranBank: {
          biayaKpr: bankBucket("BIAYA_KPR"),
          biayaAppraisal: bankBucket("BIAYA_APPRAISAL"),
        },
        pengeluaranProyek: {
          material: bucket(materialUtama, materialTerbayar),
          upah: bucket(upahUtama, upahTerbayar),
        },
        marketing,
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
