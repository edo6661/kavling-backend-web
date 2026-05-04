import { PrismaClient } from "@prisma/client";
import { seedPenjualanReal } from "./seeds/penjualanSeed.ts";
import { seedUser } from "./seeds/userSeed.ts";
import clearDatabase from "./clear.ts";
import { seedKavlingTersedia } from "./seeds/kavlingTersediaSeed.ts";

const prisma = new PrismaClient();

async function main() {
  console.log("Memulai proses seeding...");
  await clearDatabase(prisma);
  await seedUser(prisma);

  await seedPenjualanReal(prisma);
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
