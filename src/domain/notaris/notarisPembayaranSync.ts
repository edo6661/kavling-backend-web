import {
  NotarisPembayaranJenis,
  NotarisPembayaranStatus,
  Prisma,
} from "@prisma/client";
import type { PrismaClient } from "@prisma/client";

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
      progressPenjualan: { select: { biayaBphtb: true } },
    },
  });

  if (!penjualan) return null;

  return {
    biayaNotaris: penjualan.detailKavlingPajak?.biayaNotaris
      ? Number(penjualan.detailKavlingPajak.biayaNotaris)
      : 0,
    biayaBphtb: penjualan.progressPenjualan?.biayaBphtb
      ? Number(penjualan.progressPenjualan.biayaBphtb)
      : 0,
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
      ],
    },
    select: { id: true },
  });

  for (const row of penjualanRows) {
    await syncNotarisPembayaranForPenjualan(db, row.id);
  }
}
