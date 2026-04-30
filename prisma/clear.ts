import { PrismaClient } from "@prisma/client";
export default async function clearDatabase(prisma: PrismaClient) {
  console.log("Sedang mengosongkan database...");
  try {
    await prisma.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS = 0;`);
    const tables = [
      "progress_proyek",
      "riwayat_ganti_kavling",
      "riwayat_spr",
      "detail_kavling_pajak",
      "fee_agent",
      "pengajuan_batal",
      "tagihan",
      "penjualan",
      "kavling",
      "bank_rekening_pt",
      "perumahan",
      "customers",
      "agents",
    ];
    for (const table of tables) {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE \`${table}\`;`);
    }
  } catch (error) {
    console.error("Gagal mengosongkan database:", error);
  } finally {
    await prisma.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS = 1;`);
  }
  console.log("Database berhasil dikosongkan!");
}
