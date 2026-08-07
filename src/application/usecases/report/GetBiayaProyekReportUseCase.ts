import type { PrismaClient, SpkPembayaranStatus } from "@prisma/client";
import { Prisma } from "@prisma/client";
import type {
  BiayaProyekReportDTO,
  BiayaProyekReportFilterDTO,
  BiayaProyekByJenisDTO,
} from "../../../domain/dtos/BiayaProyekReportDTO.js";
import { SPK_PEMBAYARAN_JENIS_LABEL } from "../../../domain/spk/spkPembayaranCalc.js";

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

function pembayaranInDateRange(
  row: {
    jenis: string;
    tanggalPembayaran: Date | null;
    tanggalPo: Date | null;
    tanggalDari: Date | null;
    tanggalSampai: Date | null;
    createdAt: Date;
    kasbonBaris: { tanggalPo: Date }[];
  },
  start?: Date,
  end?: Date,
): boolean {
  if (!start && !end) return true;

  const candidates: Date[] = [];
  if (row.tanggalPembayaran) candidates.push(row.tanggalPembayaran);
  if (row.tanggalPo) candidates.push(row.tanggalPo);
  if (row.tanggalDari) candidates.push(row.tanggalDari);
  if (row.tanggalSampai) candidates.push(row.tanggalSampai);
  if (row.kasbonBaris.length > 0) {
    for (const b of row.kasbonBaris) candidates.push(b.tanggalPo);
  }
  candidates.push(row.createdAt);

  return candidates.some((d) => {
    if (start && d < start) return false;
    if (end && d > end) return false;
    return true;
  });
}

function emptyByJenis(): BiayaProyekByJenisDTO {
  return {};
}

export class GetBiayaProyekReportUseCase {
  constructor(private readonly db: PrismaClient) {}

  async execute(filters: BiayaProyekReportFilterDTO): Promise<BiayaProyekReportDTO> {
    const start = parseDateStart(filters.startDate);
    const end = parseDateEnd(filters.endDate);

    const spkWhere: Prisma.SpkWhereInput = {
      ...(filters.spkId ? { id: filters.spkId } : {}),
      ...(filters.perumahanId || filters.blok
        ? {
            penjualanItems: {
              some: {
                kavling: {
                  ...(filters.perumahanId ? { perumahanId: filters.perumahanId } : {}),
                  ...(filters.blok ? { blok: filters.blok } : {}),
                },
              },
            },
          }
        : {}),
    };

    const pembayaranStatusFilter =
      filters.pembayaranStatus && filters.pembayaranStatus !== "ALL"
        ? filters.pembayaranStatus
        : undefined;

    const spkRows = await this.db.spk.findMany({
      where: spkWhere,
      orderBy: { tanggalSpk: "desc" },
      select: {
        id: true,
        noSpk: true,
        judulPekerjaan: true,
        nilaiKontrak: true,
        nilaiSudahDibayarkan: true,
        sisaNilaiKontrak: true,
        mandor: { select: { id: true, username: true } },
        penjualanItems: {
          select: {
            kavling: {
              select: {
                id: true,
                blok: true,
                nomorUnit: true,
                perumahanId: true,
                perumahan: { select: { nama: true } },
              },
            },
          },
        },
        pembayaranList: {
          where: {
            status: { not: "DRAFT" },
            ...(pembayaranStatusFilter ? { status: pembayaranStatusFilter } : {}),
          },
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            jenis: true,
            nominal: true,
            status: true,
            keterangan: true,
            isMandorSendiri: true,
            tanggalPembayaran: true,
            tanggalPo: true,
            tanggalDari: true,
            tanggalSampai: true,
            createdAt: true,
            kasbonBaris: {
              orderBy: { id: "asc" },
              select: {
                id: true,
                namaSupplier: true,
                keterangan: true,
                tanggalPo: true,
                nominal: true,
              },
            },
            upahBaris: {
              orderBy: { id: "asc" },
              select: {
                id: true,
                nik: true,
                nama: true,
                nominal: true,
              },
            },
          },
        },
      },
    });

    const byJenis = emptyByJenis();
    const supplierMap = new Map<string, { count: number; total: number }>();
    const tukangMap = new Map<string, { nik: string; nama: string; count: number; total: number }>();

    let totalNilaiKontrak = 0;
    let totalSudahDibayar = 0;
    let totalKasbon = 0;
    let totalUpah = 0;

    const items = spkRows.map((spk) => {
      const nilaiKontrak = Number(spk.nilaiKontrak);
      totalNilaiKontrak += nilaiKontrak;

      const filteredPembayaran = spk.pembayaranList.filter((p) =>
        pembayaranInDateRange(p, start, end),
      );

      let spkTotalPembayaran = 0;
      let spkTotalKasbon = 0;
      let spkTotalUpah = 0;

      const pembayaran = filteredPembayaran.map((p) => {
        const nominal = Number(p.nominal);
        spkTotalPembayaran += nominal;

        if (p.status === "SUDAH_DIBAYAR" && !p.isMandorSendiri) {
          totalSudahDibayar += nominal;
        }

        if (!p.isMandorSendiri) {
          byJenis[p.jenis] = (byJenis[p.jenis] ?? 0) + nominal;
        }

        if (p.jenis === "KASBON") {
          const kasbonTotal =
            p.kasbonBaris.length > 0
              ? p.kasbonBaris.reduce((s, b) => s + Number(b.nominal), 0)
              : nominal;
          spkTotalKasbon += kasbonTotal;
          totalKasbon += kasbonTotal;

          for (const baris of p.kasbonBaris) {
            const supplier = baris.namaSupplier?.trim() || "Tanpa Supplier";
            const barisNominal = Number(baris.nominal);
            const existing = supplierMap.get(supplier) ?? { count: 0, total: 0 };
            supplierMap.set(supplier, {
              count: existing.count + 1,
              total: existing.total + barisNominal,
            });
          }
          if (p.kasbonBaris.length === 0) {
            const supplier = "Kasbon (tanpa rincian)";
            const existing = supplierMap.get(supplier) ?? { count: 0, total: 0 };
            supplierMap.set(supplier, {
              count: existing.count + 1,
              total: existing.total + nominal,
            });
          }
        }

        if (p.jenis === "UPAH") {
          spkTotalUpah += nominal;
          totalUpah += nominal;

          if (p.upahBaris.length > 0) {
            const barisWithNominal = p.upahBaris.filter((b) => Number(b.nominal) > 0);
            if (barisWithNominal.length > 0) {
              for (const baris of barisWithNominal) {
                const key = baris.nik || baris.nama;
                const barisNominal = Number(baris.nominal);
                const existing = tukangMap.get(key) ?? {
                  nik: baris.nik,
                  nama: baris.nama,
                  count: 0,
                  total: 0,
                };
                tukangMap.set(key, {
                  ...existing,
                  count: existing.count + 1,
                  total: existing.total + barisNominal,
                });
              }
            } else {
              const share = nominal / p.upahBaris.length;
              for (const baris of p.upahBaris) {
                const key = baris.nik || baris.nama;
                const existing = tukangMap.get(key) ?? {
                  nik: baris.nik,
                  nama: baris.nama,
                  count: 0,
                  total: 0,
                };
                tukangMap.set(key, {
                  ...existing,
                  count: existing.count + 1,
                  total: existing.total + share,
                });
              }
            }
          }
        }

        return {
          id: p.id,
          jenis: p.jenis,
          jenisLabel: SPK_PEMBAYARAN_JENIS_LABEL[p.jenis],
          nominal,
          status: p.status as SpkPembayaranStatus,
          keterangan: p.keterangan,
          tanggalPembayaran: toIsoDate(p.tanggalPembayaran),
          tanggalPo: toIsoDate(p.tanggalPo),
          tanggalDari: toIsoDate(p.tanggalDari),
          tanggalSampai: toIsoDate(p.tanggalSampai),
          kasbonBaris: p.kasbonBaris.map((b) => ({
            id: b.id,
            namaSupplier: b.namaSupplier,
            keterangan: b.keterangan,
            tanggalPo: toIsoDate(b.tanggalPo) ?? "",
            nominal: Number(b.nominal),
          })),
          upahBaris: p.upahBaris.map((b) => ({
            id: b.id,
            nik: b.nik,
            nama: b.nama,
            nominal: Number(b.nominal),
          })),
        };
      });

      const nilaiSudahDibayarkan = Number(spk.nilaiSudahDibayarkan ?? 0);
      const sisaNilaiKontrak = Number(spk.sisaNilaiKontrak ?? nilaiKontrak - nilaiSudahDibayarkan);

      return {
        spkId: spk.id,
        noSpk: spk.noSpk,
        judulPekerjaan: spk.judulPekerjaan,
        nilaiKontrak,
        nilaiSudahDibayarkan,
        sisaNilaiKontrak,
        mandor: spk.mandor,
        kavlingUnits: spk.penjualanItems.map((item) => ({
          kavlingId: item.kavling.id,
          blok: item.kavling.blok,
          nomorUnit: item.kavling.nomorUnit,
          perumahanId: item.kavling.perumahanId,
          perumahanNama: item.kavling.perumahan.nama,
        })),
        pembayaran,
        totalPembayaran: spkTotalPembayaran,
        totalKasbon: spkTotalKasbon,
        totalUpah: spkTotalUpah,
      };
    });

    const visibleItems =
      start || end
        ? items.filter((item) => item.pembayaran.length > 0)
        : items;

    return {
      filters,
      summary: {
        jumlahSpk: visibleItems.length,
        totalNilaiKontrak,
        totalSudahDibayar,
        totalSisa: totalNilaiKontrak - totalSudahDibayar,
        byJenis,
        totalKasbon,
        totalUpah,
      },
      items: visibleItems,
      bySupplier: [...supplierMap.entries()]
        .map(([namaSupplier, data]) => ({
          namaSupplier,
          jumlahTransaksi: data.count,
          totalNominal: data.total,
        }))
        .sort((a, b) => b.totalNominal - a.totalNominal),
      byTukang: [...tukangMap.values()]
        .map((data) => ({
          nik: data.nik,
          nama: data.nama,
          jumlahTransaksi: data.count,
          totalNominal: Math.round(data.total),
        }))
        .sort((a, b) => b.totalNominal - a.totalNominal),
    };
  }
}
