import { PrismaClient } from "@prisma/client";

// export default async function clearDatabase(prisma: PrismaClient) {
//   console.log("Sedang mengosongkan database...");
//   try {
//     await prisma.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS = 0;`);

//     const tables = [
//       "audit_logs",
//       "progress_penjualan",
//       "progress_proyek",
//       "riwayat_ganti_kavling",
//       "riwayat_spr",
//       "detail_kavling_pajak",
//       "pengajuan_batal",
//       "fee_agent",
//       "tagihan",
//       "penjualan",
//       "kavling",
//       "bank_rekening_pt",
//       "perumahan",
//       "customers",
//       "pic_agents",
//       "agents",
//       "pic_notaris",
//       "notaris",
//       "spk",
//       "users",
//     ];

//     for (const table of tables) {
//       await prisma.$executeRawUnsafe(`TRUNCATE TABLE \`${table}\`;`);
//     }
//   } catch (error) {
//     console.error("Gagal mengosongkan database:", error);
//   } finally {
//     await prisma.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS = 1;`);
//   }

//   console.log("Database berhasil dikosongkan!");
// }
