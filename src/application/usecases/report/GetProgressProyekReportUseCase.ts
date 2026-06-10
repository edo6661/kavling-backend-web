import type { PrismaClient } from "@prisma/client";
import { Prisma } from "@prisma/client";
import type {
  ProgressProyekReportDTO,
  ProgressProyekReportFilterDTO,
  ProgressProyekUnitItemDTO,
  ProgressProyekBlokRowDTO,
  ProgressProyekSpkRowDTO,
} from "../../../domain/dtos/ProgressProyekReportDTO.js";
import { penjualanKavlingWithSpkInclude } from "../../../domain/repositories/IPenjualanRepo.js";

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

function tahapanInDateRange(tanggal: Date, start?: Date, end?: Date): boolean {
  if (start && tanggal < start) return false;
  if (end && tanggal > end) return false;
  return true;
}

function resolveProgress(
  progressProyek: {
    persentase: Prisma.Decimal;
    persentaseOverride: Prisma.Decimal | null;
    mandorId: number | null;
    mandor: { id: number; username: string } | null;
  } | null,
  spk: {
    mandorId: number;
    mandor: { id: number; username: string };
    progressOverride: Prisma.Decimal | null;
  } | null | undefined,
): { progress: number; mandor: { id: number; username: string } | null } {
  if (progressProyek) {
    const progress =
      progressProyek.persentaseOverride != null
        ? Number(progressProyek.persentaseOverride)
        : Number(progressProyek.persentase);
    const mandor =
      progressProyek.mandor ??
      (spk ? { id: spk.mandorId, username: spk.mandor.username } : null);
    return { progress, mandor };
  }

  if (spk?.progressOverride != null) {
    return {
      progress: Math.min(100, Math.max(0, Number(spk.progressOverride))),
      mandor: { id: spk.mandorId, username: spk.mandor.username },
    };
  }

  return {
    progress: 0,
    mandor: spk ? { id: spk.mandorId, username: spk.mandor.username } : null,
  };
}

function classifyProgress(progress: number): "selesai" | "proses" | "belumMulai" {
  if (progress >= 100) return "selesai";
  if (progress > 0) return "proses";
  return "belumMulai";
}

export class GetProgressProyekReportUseCase {
  constructor(private readonly db: PrismaClient) {}

  async execute(
    filters: ProgressProyekReportFilterDTO,
  ): Promise<ProgressProyekReportDTO> {
    const start = parseDateStart(filters.startDate);
    const end = parseDateEnd(filters.endDate);

    const kavlingScope: Prisma.KavlingWhereInput = {
      ...(filters.perumahanId ? { perumahanId: filters.perumahanId } : {}),
      ...(filters.blok ? { blok: filters.blok } : {}),
      ...(filters.spkId
        ? { spkItem: { is: { spkId: filters.spkId } } }
        : {}),
    };

    const mandorScope: Prisma.PenjualanWhereInput | undefined = filters.mandorId
      ? {
          OR: [
            { progressProyek: { mandorId: filters.mandorId } },
            {
              kavling: {
                spkItem: { is: { spk: { mandorId: filters.mandorId } } },
              },
            },
          ],
        }
      : undefined;

    const penjualanRows = await this.db.penjualan.findMany({
      where: {
        status: { not: "BATAL" },
        kavling: kavlingScope,
        ...(mandorScope ? { AND: [mandorScope] } : {}),
      },
      select: {
        id: true,
        status: true,
        customer: { select: { nama: true } },
        kavling: {
          select: {
            id: true,
            blok: true,
            nomorUnit: true,
            perumahanId: true,
            perumahan: { select: { nama: true } },
            spkItem: penjualanKavlingWithSpkInclude.spkItem,
          },
        },
        progressProyek: {
          include: {
            mandor: { select: { id: true, username: true } },
            tahapan: {
              orderBy: [{ tanggal: "desc" }, { id: "desc" }],
              include: {
                reportedBy: { select: { username: true } },
              },
            },
          },
        },
      },
    });

    const kavlingMandorScope: Prisma.KavlingWhereInput | undefined =
      filters.mandorId
        ? {
            OR: [
              { spkItem: { is: { spk: { mandorId: filters.mandorId } } } },
              { progressProyek: { mandorId: filters.mandorId } },
            ],
          }
        : undefined;

    const kavlingOnlyRows = await this.db.kavling.findMany({
      where: {
        ...kavlingScope,
        penjualan: { none: { status: { not: "BATAL" } } },
        ...(kavlingMandorScope ? kavlingMandorScope : {}),
      },
      include: {
        perumahan: { select: { nama: true } },
        spkItem: penjualanKavlingWithSpkInclude.spkItem,
        progressProyek: {
          include: {
            mandor: { select: { id: true, username: true } },
            tahapan: {
              orderBy: [{ tanggal: "desc" }, { id: "desc" }],
              include: {
                reportedBy: { select: { username: true } },
              },
            },
          },
        },
      },
    });

    const rawItems: ProgressProyekUnitItemDTO[] = [];

    for (const row of penjualanRows) {
      const spk = row.kavling.spkItem?.spk;
      const { progress, mandor } = resolveProgress(row.progressProyek, spk);
      const allTahapan = row.progressProyek?.tahapan ?? [];
      const tahapan = allTahapan
        .filter((t) => tahapanInDateRange(t.tanggal, start, end))
        .map((t) => ({
          id: t.id,
          namaTahapan: t.namaTahapan,
          persentase: Number(t.persentase),
          deskripsi: t.deskripsi,
          tanggal: toIsoDate(t.tanggal),
          reportedBy: t.reportedBy?.username ?? null,
        }));

      if (start || end) {
        const hasActivity = tahapan.length > 0;
        if (!hasActivity) continue;
      }

      rawItems.push({
        kavlingId: row.kavling.id,
        blok: row.kavling.blok,
        nomorUnit: row.kavling.nomorUnit,
        perumahanId: row.kavling.perumahanId,
        perumahanNama: row.kavling.perumahan.nama,
        customerNama: row.customer.nama,
        penjualanStatus: row.status,
        spkId: spk?.id ?? null,
        noSpk: spk?.noSpk ?? null,
        judulPekerjaan: spk?.judulPekerjaan ?? null,
        mandor,
        progress,
        tahapTerakhir:
          tahapan[0]?.namaTahapan ??
          allTahapan[0]?.namaTahapan ??
          "Belum ada laporan",
        isLate: progress < 50 && progress > 0,
        jumlahTahapan: tahapan.length || allTahapan.length,
        tahapan: tahapan.length > 0 ? tahapan : allTahapan.map((t) => ({
          id: t.id,
          namaTahapan: t.namaTahapan,
          persentase: Number(t.persentase),
          deskripsi: t.deskripsi,
          tanggal: toIsoDate(t.tanggal),
          reportedBy: t.reportedBy?.username ?? null,
        })),
      });
    }

    for (const k of kavlingOnlyRows) {
      const spk = k.spkItem?.spk;
      const { progress, mandor } = resolveProgress(k.progressProyek, spk);
      const allTahapan = k.progressProyek?.tahapan ?? [];
      const tahapan = allTahapan
        .filter((t) => tahapanInDateRange(t.tanggal, start, end))
        .map((t) => ({
          id: t.id,
          namaTahapan: t.namaTahapan,
          persentase: Number(t.persentase),
          deskripsi: t.deskripsi,
          tanggal: toIsoDate(t.tanggal),
          reportedBy: t.reportedBy?.username ?? null,
        }));

      if (start || end) {
        if (tahapan.length === 0) continue;
      }

      rawItems.push({
        kavlingId: k.id,
        blok: k.blok,
        nomorUnit: k.nomorUnit,
        perumahanId: k.perumahanId,
        perumahanNama: k.perumahan.nama,
        customerNama: "—",
        penjualanStatus: "BELUM_TERJUAL",
        spkId: spk?.id ?? null,
        noSpk: spk?.noSpk ?? null,
        judulPekerjaan: spk?.judulPekerjaan ?? null,
        mandor,
        progress,
        tahapTerakhir:
          tahapan[0]?.namaTahapan ??
          allTahapan[0]?.namaTahapan ??
          "Belum ada laporan",
        isLate: progress < 50 && progress > 0,
        jumlahTahapan: tahapan.length || allTahapan.length,
        tahapan: tahapan.length > 0 ? tahapan : allTahapan.map((t) => ({
          id: t.id,
          namaTahapan: t.namaTahapan,
          persentase: Number(t.persentase),
          deskripsi: t.deskripsi,
          tanggal: toIsoDate(t.tanggal),
          reportedBy: t.reportedBy?.username ?? null,
        })),
      });
    }

    rawItems.sort((a, b) => {
      const blokCmp = a.blok.localeCompare(b.blok);
      if (blokCmp !== 0) return blokCmp;
      return a.nomorUnit.localeCompare(b.nomorUnit, undefined, { numeric: true });
    });

    const blokMap = new Map<
      string,
      ProgressProyekBlokRowDTO & { progressSum: number }
    >();
    const spkMap = new Map<
      number,
      ProgressProyekSpkRowDTO & { progressSum: number }
    >();

    let progressSum = 0;
    let unitSelesai = 0;
    let unitProses = 0;
    let unitBelumMulai = 0;
    let unitTerlambat = 0;

    for (const item of rawItems) {
      progressSum += item.progress;
      const cls = classifyProgress(item.progress);
      if (cls === "selesai") unitSelesai++;
      else if (cls === "proses") unitProses++;
      else unitBelumMulai++;
      if (item.isLate) unitTerlambat++;

      const blokRow = blokMap.get(item.blok) ?? {
        blok: item.blok,
        totalUnit: 0,
        rataRataProgress: 0,
        selesai: 0,
        proses: 0,
        belumMulai: 0,
        progressSum: 0,
      };
      blokRow.totalUnit++;
      blokRow.progressSum += item.progress;
      if (cls === "selesai") blokRow.selesai++;
      else if (cls === "proses") blokRow.proses++;
      else blokRow.belumMulai++;
      blokMap.set(item.blok, blokRow);

      if (item.spkId && item.mandor) {
        const spkRow = spkMap.get(item.spkId) ?? {
          spkId: item.spkId,
          noSpk: item.noSpk!,
          judulPekerjaan: item.judulPekerjaan!,
          mandor: item.mandor,
          totalUnit: 0,
          rataRataProgress: 0,
          selesai: 0,
          proses: 0,
          progressSum: 0,
        };
        spkRow.totalUnit++;
        spkRow.progressSum += item.progress;
        if (cls === "selesai") spkRow.selesai++;
        else if (cls === "proses") spkRow.proses++;
        spkMap.set(item.spkId, spkRow);
      }
    }

    const byBlok: ProgressProyekBlokRowDTO[] = [...blokMap.values()]
      .map(({ progressSum, ...row }) => ({
        ...row,
        rataRataProgress:
          row.totalUnit > 0 ? Math.round(progressSum / row.totalUnit) : 0,
      }))
      .sort((a, b) => a.blok.localeCompare(b.blok));

    const bySpk: ProgressProyekSpkRowDTO[] = [...spkMap.values()]
      .map(({ progressSum: sum, ...row }) => ({
        ...row,
        rataRataProgress:
          row.totalUnit > 0 ? Math.round(sum / row.totalUnit) : 0,
      }))
      .sort((a, b) => a.noSpk.localeCompare(b.noSpk));

    return {
      filters,
      summary: {
        totalUnit: rawItems.length,
        rataRataProgress:
          rawItems.length > 0 ? Math.round(progressSum / rawItems.length) : 0,
        unitSelesai,
        unitProses,
        unitBelumMulai,
        unitTerlambat,
      },
      byBlok,
      bySpk,
      items: rawItems,
    };
  }
}
