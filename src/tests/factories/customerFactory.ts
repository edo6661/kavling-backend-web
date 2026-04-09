import type { Prisma } from "@prisma/client";
import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker/locale/id_ID";

const prisma = new PrismaClient();

export const CustomerFactory = {
  async create(overrides: Partial<Prisma.CustomerUncheckedCreateInput> = {}) {
    const data = {
      nikKtp: faker.string.numeric(16),
      nama: faker.person.fullName(),
      noHp: faker.phone.number(),
      alamatKtp: faker.location.streetAddress(),
      ...overrides,
    } as Prisma.CustomerUncheckedCreateInput;

    Object.keys(data).forEach((key) => {
      if (data[key as keyof typeof data] === undefined) {
        delete data[key as keyof typeof data];
      }
    });

    return await prisma.customer.create({ data });
  },
};
