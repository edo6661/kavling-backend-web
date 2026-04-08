import type { Prisma } from "@prisma/client";
import { PrismaClient, SprStatus, CaraPembayaran } from "@prisma/client";
import { faker } from "@faker-js/faker/locale/id_ID";

const prisma = new PrismaClient();

type SprFactoryArgs = Partial<Prisma.SprUncheckedCreateInput> & {
  customerId: number;
  unitId: number;
  marketingUserId: number;
  bankRekeningPtId: number;
};

export const SprFactory = {
  async create(overrides: SprFactoryArgs) {
    return await prisma.spr.create({
      data: {
        nomorSpr: `SPR-${faker.string.alphanumeric(6).toUpperCase()}`,
        hargaJual: faker.number.int({ min: 300000000, max: 800000000 }),
        diskonPenjualan: faker.number.int({ min: 0, max: 20000000 }),
        paketPromosi: faker.helpers.arrayElement([
          "Promo Kemerdekaan",
          "Free Kanopi",
          "Cashback 10JT",
          null,
        ]),
        caraPembayaran: faker.helpers.objectValue(CaraPembayaran),
        bankKpr: "BTN",
        nilaiPengajuanKpr: faker.number.int({ min: 250000000, max: 700000000 }),
        ttdPemesan: `ttd-pemesan-${faker.string.uuid()}.png`,
        ttdMarketing: `ttd-marketing-${faker.string.uuid()}.png`,
        ttdSupervisor: `ttd-spv-${faker.string.uuid()}.png`,
        ttdManager: `ttd-manager-${faker.string.uuid()}.png`,
        ttdSalesAdmin: `ttd-admin-${faker.string.uuid()}.png`,
        tanggalTtdPemesan: faker.date.recent(),
        tanggalTtdMarketing: faker.date.recent(),
        tanggalTtdSupervisor: faker.date.recent(),
        tanggalTtdManager: faker.date.recent(),
        tanggalTtdSalesAdmin: faker.date.recent(),
        status: SprStatus.AKTIF,
        agent: faker.person.fullName(),
        ...overrides,
      },
    });
  },
};
