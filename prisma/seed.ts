import { PrismaClient } from "@prisma/client";
import { seedUser } from "./seeds/userSeed.ts";
// import clearDatabase from "./clear.ts";
import { seedAgent } from "./seeds/agentSeed.ts";
import { seedBankRekeningPt } from "./seeds/bankRekeningPtSeed.ts";
import { seedPerumahan } from "./seeds/perumahanSeed.ts";
import { seedKavling } from "./seeds/kavlingSeed.ts";
import { seedPenjualan } from "./seeds/penjualanSeed.ts";
import { seedRolePermission } from "./seeds/rolePermissionSeed.ts";
import { seedKavlingTersedia } from "./seeds/kavlingTersediaSeed.ts";

const prisma = new PrismaClient();

async function main() {
  console.log("Memulai proses seeding...");

  // clearDatabase(prisma);
  seedKavling(prisma);
  // seedKavlingTersedia(prisma);
  // seedUser(prisma);
  // seedPerumahan(prisma);
  // seedBankRekeningPt(prisma);
  // seedPenjualan(prisma);
  // seedAgent(prisma);
  // seedRolePermission(prisma);
  // seedBankRekeningPt(prisma);
  // seedKavling(prisma);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
