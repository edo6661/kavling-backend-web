import {
  NotarisPembayaranJenis,
  NotarisPembayaranStatus,
  Prisma,
} from "@prisma/client";
import type { PrismaClient } from "@prisma/client";
import { sumBiayaBphtb } from "../progressPenjualan/progressPenjualanSertifikatUtils.js";

type SyncClient = Prisma.TransactionClient | PrismaClient;

const JENIS_CONFIG: {
  jenis: NotarisPembayaranJenis;
  getNominal: (ctx: SyncContext) => number;
}[] = [
  {
    jenis: "BIAYA_NOTARIS",
    getNominal: (ctx) => ctx.biayaNotaris,
  },
  {
    jenis: "BPHTB",
    getNominal: (ctx) => ctx.biayaBphtb,
  },
];

interface SyncContext {
  biayaNotaris: number;
  biayaBphtb: number;
}

async function loadSyncContext(
  db: SyncClient,
  penjualanId: number,
): Promise<SyncContext | null> {
  const penjualan = await db.penjualan.findUnique({
    where: { id: penjualanId },
    select: {
      id: true,
      detailKavlingPajak: { select: { biayaNotaris: true } },
      progressPenjualan: {
        select: {
          biayaBphtb: true,
          biayaPph: true,
          nilaiAjb: true,
          filePpjb: true,
          fileAjb: true,
          sertifikatTambahan: {
            select: {
              urutan: true,
              biayaBphtb: true,
              biayaPph: true,
              nilaiAjb: true,
              filePpjb: true,
              fileAjb: true,
            },
          },
        },
      },
    },
  });

  if (!penjualan) return null;

  const progress = penjualan.progressPenjualan;
  const utamaSlot = progress
    ? {
        biayaBphtb: progress.biayaBphtb ? Number(progress.biayaBphtb) : null,
        biayaPph: progress.biayaPph ? Number(progress.biayaPph) : null,
        nilaiAjb: progress.nilaiAjb ? Number(progress.nilaiAjb) : null,
        filePpjb: progress.filePpjb,
        fileAjb: progress.fileAjb,
      }
    : null;
  const tambahanSlots =
    progress?.sertifikatTambahan.map((row) => ({
      urutan: row.urutan,
      biayaBphtb: row.biayaBphtb ? Number(row.biayaBphtb) : null,
      biayaPph: row.biayaPph ? Number(row.biayaPph) : null,
      nilaiAjb: row.nilaiAjb ? Number(row.nilaiAjb) : null,
      filePpjb: row.filePpjb,
      fileAjb: row.fileAjb,
    })) ?? [];

  return {
    biayaNotaris: penjualan.detailKavlingPajak?.biayaNotaris
      ? Number(penjualan.detailKavlingPajak.biayaNotaris)
      : 0,
    biayaBphtb: sumBiayaBphtb(utamaSlot, tambahanSlots),
  };
}

export async function syncNotarisPembayaranForPenjualan(
  db: SyncClient,
  penjualanId: number,
): Promise<void> {
  const ctx = await loadSyncContext(db, penjualanId);
  if (!ctx) return;

  for (const { jenis, getNominal } of JENIS_CONFIG) {
    const nominal = getNominal(ctx);
    const existing = await db.notarisPembayaran.findUnique({
      where: { penjualanId_jenis: { penjualanId, jenis } },
    });

    if (nominal <= 0) continue;

    if (existing) {
      if (
        existing.status === NotarisPembayaranStatus.MENUNGGU_PEMBAYARAN &&
        Number(existing.nominal) !== nominal
      ) {
        await db.notarisPembayaran.update({
          where: { id: existing.id },
          data: { nominal: new Prisma.Decimal(nominal) },
        });
      }
      continue;
    }

    await db.notarisPembayaran.create({
      data: {
        penjualanId,
        jenis,
        nominal: new Prisma.Decimal(nominal),
        status: NotarisPembayaranStatus.MENUNGGU_PEMBAYARAN,
      },
    });
  }
}

export async function syncAllEligibleNotarisPembayaran(
  db: PrismaClient,
): Promise<void> {
  const penjualanRows = await db.penjualan.findMany({
    where: {
      OR: [
        {
          detailKavlingPajak: {
            biayaNotaris: { gt: 0 },
          },
        },
        {
          progressPenjualan: {
            biayaBphtb: { gt: 0 },
          },
        },
        {
          progressPenjualan: {
            sertifikatTambahan: {
              some: { biayaBphtb: { gt: 0 } },
            },
          },
        },
      ],
    },
    select: { id: true },
  });

  for (const row of penjualanRows) {
    await syncNotarisPembayaranForPenjualan(db, row.id);
  }
}
