import { PrismaClient } from "@prisma/client";
import { seedUser } from "./seeds/userSeed";
import { seedPerumahan } from "./seeds/perumahanSeed";
import { seedNotaris } from "./seeds/notarisSeed";
import { seedAgent } from "./seeds/agentSeed";
import { seedBankRekeningPt } from "./seeds/bankRekeningPtSeed";
import { seedCustomer } from "./seeds/customerSeed";
import { seedKavling } from "./seeds/kavlingSeed";
import { seedSpk } from "./seeds/spkSeed";
import { seedPenjualan } from "./seeds/penjualanSeed";
import { seedDetailKavlingPajak } from "./seeds/detailKavlingPajakSeed";
import { seedTagihan } from "./seeds/tagihanSeed";
import { seedFeeAgent } from "./seeds/feeAgentSeed";
import { seedProgressProyek } from "./seeds/progressPoyekSeed.ts";

const prisma = new PrismaClient();

async function main() {
  await seedUser(prisma);
  await seedPerumahan(prisma);
  // await seedNotaris(prisma);
  // await seedAgent(prisma);
  await seedBankRekeningPt(prisma);

  // await seedCustomer(prisma);
  // await seedKavling(prisma);
  // await seedSpk(prisma);

  // await seedPenjualan(prisma);
  // await seedDetailKavlingPajak(prisma);
  // await seedTagihan(prisma);
  // await seedFeeAgent(prisma);
  // await seedProgressProyek(prisma);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
