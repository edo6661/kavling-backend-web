import { PrismaClient } from "@prisma/client";
import { seedBankRekeningPt } from "./seeds/bankRekeningPtSeed.js";
import { seedCustomers } from "./seeds/customerSeed.js";
import { seedSprs } from "./seeds/sprSeed.js";
import { seedUsers } from "./seeds/userSeed.js";
import { seedUnits } from "./seeds/unitSeed.js";
import { seedMasterDataProgress } from "./seeds/masterDataProgressSeed.js";

const prisma = new PrismaClient();

async function cleanDatabase() {
  console.log("Membersihkan data lama...");
  await prisma.masterDataProgress.deleteMany();
  await prisma.sprPayment.deleteMany();
  await prisma.spr.deleteMany();
  await prisma.unit.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.bankRekeningPt.deleteMany();
  await prisma.user.deleteMany();
}

async function main() {
  console.log("Mulai melakukan seeding database...");

  await cleanDatabase();

  console.log("Seeding Users...");
  await seedUsers(prisma);

  console.log("Seeding Units...");
  await seedUnits(prisma);

  console.log("Seeding Bank Rekening PT...");
  await seedBankRekeningPt(prisma);

  console.log("Seeding Customers...");
  await seedCustomers(prisma);

  console.log("Seeding Transaksi SPR & Payment...");
  await seedSprs(prisma);

  console.log("Seeding Master Data Progress (Kalkulasi Lengkap)...");
  await seedMasterDataProgress(prisma);

  console.log("Seeding selesai dengan sukses.");
}

main()
  .catch((e) => {
    console.error("Error saat seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
