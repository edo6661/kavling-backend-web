import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker/locale/id_ID";

const prisma = new PrismaClient();

export const BankRekeningPtFactory = {
  async create(
    overrides: Partial<
      Parameters<typeof prisma.bankRekeningPt.create>[0]["data"]
    > = {},
  ) {
    return await prisma.bankRekeningPt.create({
      data: {
        namaBank: "BCA",
        noRekening: faker.finance.accountNumber(),
        atasNama: "PT Bumantara Sejahtera",
        ...overrides,
      },
    });
  },
};
