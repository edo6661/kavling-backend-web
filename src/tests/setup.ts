import { prisma } from "../infrastructure/database/prisma";

export const prismaTest = prisma;

export const clearDatabase = async () => {
  const tableNames = await prismaTest.$queryRaw<
    { TABLE_NAME: string }[]
  >`SELECT TABLE_NAME from information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME != '_prisma_migrations';`;

  for (const { TABLE_NAME } of tableNames) {
    if (TABLE_NAME !== "_prisma_migrations") {
      try {
        await prismaTest.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS = 0;`);
        await prismaTest.$executeRawUnsafe(`TRUNCATE TABLE \`${TABLE_NAME}\`;`);
        await prismaTest.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS = 1;`);
      } catch (error) {
        console.log({ error });
      }
    }
  }
};

export const disconnectDatabase = async () => {
  await prismaTest.$disconnect();
};
