import { PrismaClient } from "@prisma/client";
import { seedPenjualanReal } from "./seeds/penjualanSeed.ts";
import { seedUser } from "./seeds/userSeed.ts";
import clearDatabase from "./clear.ts";
import { seedKavlingTersedia } from "./seeds/kavlingTersediaSeed.ts";
import { seedAgent } from "./seeds/agentSeed.ts";
import { seedBankRekeningPt } from "./seeds/bankRekeningPtSeed.ts";
import { seedPerumahan } from "./seeds/perumahanSeed.ts";

const prisma = new PrismaClient();

async function main() {
  console.log("Memulai proses seeding...");
  await clearDatabase(prisma);
  await seedUser(prisma);
  await seedPerumahan(prisma);
  await seedBankRekeningPt(prisma);
  await seedAgent(prisma);
  await seedKavlingTersedia(prisma);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
