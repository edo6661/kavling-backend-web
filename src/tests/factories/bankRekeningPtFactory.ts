import type { Prisma } from "@prisma/client";
import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker/locale/id_ID";

const prisma = new PrismaClient();

export const BankRekeningPtFactory = {
  async create(
    overrides: Partial<Prisma.BankRekeningPtUncheckedCreateInput> = {},
  ) {
    const data = {
      perumahanId: 1,
      namaBank: "BCA",
      noRekening: faker.finance.accountNumber(),
      atasNama: "PT Bumantara Sejahtera",
      ...overrides,
    } as Prisma.BankRekeningPtUncheckedCreateInput;

    Object.keys(data).forEach((key) => {
      if (data[key as keyof typeof data] === undefined) {
        delete data[key as keyof typeof data];
      }
    });

    return await prisma.bankRekeningPt.create({ data });
  },
};
