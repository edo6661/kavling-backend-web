import { PrismaClient, UnitStatus } from "@prisma/client";
import { faker } from "@faker-js/faker/locale/id_ID";

const prisma = new PrismaClient();

export const UnitFactory = {
  async create(
    overrides: Partial<Parameters<typeof prisma.unit.create>[0]["data"]> = {},
  ) {
    return await prisma.unit.create({
      data: {
        namaPerumahan: "Bumantara Residence",
        blokUnit: faker.location.buildingNumber(),
        tipe: faker.helpers.arrayElement(["36/60", "45/90", "54/120"]),
        luasTanah: faker.number.int({ min: 60, max: 120 }),
        luasBangunan: faker.number.int({ min: 36, max: 54 }),
        lantai: faker.number.int({ min: 1, max: 2 }),
        lokasiStrategis: faker.helpers.arrayElement([
          "Dekat Taman",
          "Hoek",
          "Jalan Utama",
          "Standar",
        ]),
        status: UnitStatus.TERSEDIA,
        ...overrides,
      },
    });
  },
};
