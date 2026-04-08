import type { Prisma } from "@prisma/client";
import { PrismaClient, PaymentStatus } from "@prisma/client";
import { faker } from "@faker-js/faker/locale/id_ID";

const prisma = new PrismaClient();

type SprPaymentFactoryArgs = Partial<Prisma.SprPaymentUncheckedCreateInput> & {
  sprId: number;
};

export const SprPaymentFactory = {
  async create(overrides: SprPaymentFactoryArgs) {
    const isLunas =
      overrides.statusPembayaran === PaymentStatus.LUNAS ||
      faker.datatype.boolean();

    return await prisma.sprPayment.create({
      data: {
        keterangan: faker.helpers.arrayElement([
          "Booking Fee",
          "DP 1",
          "DP 2",
          "Pelunasan",
        ]),
        jatuhTempo: faker.date.soon({ days: 14 }),
        nilai: faker.number.int({ min: 1000000, max: 50000000 }),
        buktiTransfer: isLunas ? `bukti-tf-${faker.string.uuid()}.jpg` : null,
        statusPembayaran: isLunas
          ? PaymentStatus.LUNAS
          : PaymentStatus.BELUM_BAYAR,
        ...overrides,
      },
    });
  },
};
