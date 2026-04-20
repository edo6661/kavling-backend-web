import { PrismaClient, UnitStatus } from "@prisma/client";

export async function seedKavling(prisma: PrismaClient) {
  await prisma.kavling.createMany({
    data: [
      {
        perumahanId: 1,
        blok: "A1",
        nomorUnit: "01",
        namaTipe: "36/60",
        luasBangunan: 36,
        luasTanah: 60,
        hargaDasar: 350000000.0,
        rekeningTujuanId: 1,
        status: UnitStatus.TERJUAL,
      },
      {
        perumahanId: 1,
        blok: "A1",
        nomorUnit: "02",
        namaTipe: "36/60",
        luasBangunan: 36,
        luasTanah: 60,
        hargaDasar: 350000000.0,
        rekeningTujuanId: 1,
        status: UnitStatus.BOOKING,
      },
      {
        perumahanId: 1,
        blok: "B",
        nomorUnit: "10A",
        namaTipe: "45/72",
        luasBangunan: 45,
        luasTanah: 72,
        hargaDasar: 550000000.0,
        rekeningTujuanId: 2,
        status: UnitStatus.AVAILABLE,
      },
    ],
  });
}
