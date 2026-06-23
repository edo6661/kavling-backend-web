/**
 * Backfill fee_agent untuk penjualan lama (mis. import Excel) yang punya agent_id
 * tapi belum punya baris di fee_agent.
 *
 * Usage:
 *   npm run backfill:fee-agent           # jalankan insert
 *   npm run backfill:fee-agent -- --dry-run   # hanya preview
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const dryRun = process.argv.includes("--dry-run");

async function main() {
  const missing = await prisma.penjualan.findMany({
    where: {
      agentId: { not: null },
      feeAgent: null,
      OR: [
        { status: { not: "BATAL" } },
        {
          status: "BATAL",
          OR: [
            { bookingFeeLunasBatal: true },
            {
              tagihan: {
                some: {
                  tujuan: "BOOKING_FEE",
                  status: "LUNAS",
                },
              },
            },
          ],
        },
      ],
    },
    select: {
      id: true,
      noTransaksi: true,
      agentId: true,
      agent: { select: { nama: true } },
    },
    orderBy: { id: "asc" },
  });

  console.log(
    dryRun
      ? `[DRY RUN] Akan membuat ${missing.length} baris fee_agent`
      : `Menemukan ${missing.length} penjualan tanpa fee_agent`,
  );

  if (missing.length === 0) {
    console.log("Tidak ada data yang perlu di-backfill.");
    return;
  }

  const preview = missing.slice(0, 15);
  for (const row of preview) {
    console.log(
      `  penjualan #${row.id} (${row.noTransaksi}) → agent #${row.agentId} (${row.agent?.nama ?? "?"})`,
    );
  }
  if (missing.length > preview.length) {
    console.log(`  ... dan ${missing.length - preview.length} lainnya`);
  }

  if (dryRun) {
    console.log("\nJalankan tanpa --dry-run untuk insert ke database.");
    return;
  }

  const result = await prisma.feeAgent.createMany({
    data: missing.map((p) => ({
      agentId: p.agentId!,
      penjualanId: p.id,
    })),
    skipDuplicates: true,
  });

  console.log(`\nSelesai. ${result.count} baris fee_agent berhasil dibuat.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
