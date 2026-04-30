import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function clearDatabase() {
  const tablenames = await prisma.$queryRaw<Array<{ TABLE_NAME: string }>>`
    SELECT TABLE_NAME FROM information_schema.tables WHERE TABLE_SCHEMA = 'kavling_backend_web_db'
  `;

  console.log("Sedang mengosongkan database...");

  await prisma.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS = 0;`);

  for (const { TABLE_NAME } of tablenames) {
    if (TABLE_NAME !== "_prisma_migrations") {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE \`${TABLE_NAME}\`;`);
    }
  }

  await prisma.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS = 1;`);
  console.log("Database berhasil dikosongkan.");
}

clearDatabase()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
