import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker/locale/id_ID";

const prisma = new PrismaClient();

export const CustomerFactory = {
  async create(
    overrides: Partial<
      Parameters<typeof prisma.customer.create>[0]["data"]
    > = {},
  ) {
    return await prisma.customer.create({
      data: {
        nikKtp: faker.string.numeric(16),
        nama: faker.person.fullName(),
        noHp: faker.phone.number(),
        alamatKtp: faker.location.streetAddress(),
        alamatTinggal: faker.location.streetAddress(),
        email: faker.internet.email(),
        pekerjaan: faker.person.jobTitle(),
        perusahaan: faker.company.name(),
        alamatKorespondensi: faker.location.streetAddress(),
        fileKtp: `ktp-${faker.string.uuid()}.pdf`,
        fileKk: `kk-${faker.string.uuid()}.pdf`,
        fileNpwp: `npwp-${faker.string.uuid()}.pdf`,
        ...overrides,
      },
    });
  },
};
