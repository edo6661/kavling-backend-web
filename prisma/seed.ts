import { PrismaClient } from "@prisma/client";
import { seedUser } from "./seeds/userSeed.ts";
import clearDatabase from "./clear.ts";
import { seedAgent } from "./seeds/agentSeed.ts";
import { seedBankRekeningPt } from "./seeds/bankRekeningPtSeed.ts";
import { seedPerumahan } from "./seeds/perumahanSeed.ts";
import { seedKavling } from "./seeds/kavlingSeed.ts";
import { seedPenjualan } from "./seeds/penjualanSeed.ts";

const prisma = new PrismaClient();

async function main() {
  console.log("Memulai proses seeding...");
  await clearDatabase(prisma);
  await seedUser(prisma);
  await seedPerumahan(prisma);
  await seedBankRekeningPt(prisma);
  await seedAgent(prisma);
  await seedKavling(prisma);
  await seedPenjualan(prisma);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
