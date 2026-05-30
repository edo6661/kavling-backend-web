import {
  BankKprPembayaranJenis,
  BankKprPembayaranStatus,
  Prisma,
} from "@prisma/client";
import type { PrismaClient } from "@prisma/client";

type SyncClient = Prisma.TransactionClient | PrismaClient;

const JENIS_CONFIG: {
  jenis: BankKprPembayaranJenis;
  getNominal: (ctx: SyncContext) => number;
}[] = [
  {
    jenis: "BIAYA_KPR",
    getNominal: (ctx) => ctx.biayaKpr,
  },
  {
    jenis: "BIAYA_APPRAISAL",
    getNominal: (ctx) => ctx.biayaAppraisal,
  },
];

interface SyncContext {
  biayaKpr: number;
  biayaAppraisal: number;
}

function resolveBiayaAppraisal(detail: {
  nrBiayaAppraisal: Prisma.Decimal | null;
  pjBiayaAppraisal: Prisma.Decimal | null;
} | null): number {
  if (!detail) return 0;

  const nr = detail.nrBiayaAppraisal ? Number(detail.nrBiayaAppraisal) : 0;
  if (nr > 0) return nr;

  const pj = detail.pjBiayaAppraisal ? Number(detail.pjBiayaAppraisal) : 0;
  return pj > 0 ? pj : 0;
}

async function loadSyncContext(
  db: SyncClient,
  penjualanId: number,
): Promise<SyncContext | null> {
  const penjualan = await db.penjualan.findUnique({
    where: { id: penjualanId },
    select: {
      id: true,
      caraPembayaran: true,
      biayaKpr: true,
      detailKavlingPajak: {
        select: { nrBiayaAppraisal: true, pjBiayaAppraisal: true },
      },
    },
  });

  if (!penjualan || penjualan.caraPembayaran !== "KPR") return null;

  return {
    biayaKpr: penjualan.biayaKpr ? Number(penjualan.biayaKpr) : 0,
    biayaAppraisal: resolveBiayaAppraisal(penjualan.detailKavlingPajak),
  };
}

export async function syncBankKprPembayaranForPenjualan(
  db: SyncClient,
  penjualanId: number,
): Promise<void> {
  const ctx = await loadSyncContext(db, penjualanId);
  if (!ctx) return;

  for (const { jenis, getNominal } of JENIS_CONFIG) {
    const nominal = getNominal(ctx);
    const existing = await db.bankKprPembayaran.findUnique({
      where: { penjualanId_jenis: { penjualanId, jenis } },
    });

    if (nominal <= 0) continue;

    if (existing) {
      if (
        existing.status === BankKprPembayaranStatus.MENUNGGU_PEMBAYARAN &&
        Number(existing.nominal) !== nominal
      ) {
        await db.bankKprPembayaran.update({
          where: { id: existing.id },
          data: { nominal: new Prisma.Decimal(nominal) },
        });
      }
      continue;
    }

    await db.bankKprPembayaran.create({
      data: {
        penjualanId,
        jenis,
        nominal: new Prisma.Decimal(nominal),
        status: BankKprPembayaranStatus.MENUNGGU_PEMBAYARAN,
      },
    });
  }
}

export async function syncAllEligibleBankKprPembayaran(
  db: PrismaClient,
): Promise<void> {
  const penjualanRows = await db.penjualan.findMany({
    where: {
      caraPembayaran: "KPR",
      OR: [
        { biayaKpr: { gt: 0 } },
        {
          detailKavlingPajak: {
            OR: [
              { nrBiayaAppraisal: { gt: 0 } },
              { pjBiayaAppraisal: { gt: 0 } },
            ],
          },
        },
      ],
    },
    select: { id: true },
  });

  for (const row of penjualanRows) {
    await syncBankKprPembayaranForPenjualan(db, row.id);
  }
}
