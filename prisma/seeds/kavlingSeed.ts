import { PrismaClient, UnitStatus } from "@prisma/client";

export async function seedKavling(prisma: PrismaClient) {
  await prisma.kavling.createMany({
    data: [
      {
        perumahanId: 1,
        blok: "A1",
        nomorUnit: "01",
        tipe: "36/60",
        hargaJual: 350000000.0,
        status: UnitStatus.TERJUAL,
      },
      {
        perumahanId: 1,
        blok: "A1",
        nomorUnit: "02",
        tipe: "36/60",
        hargaJual: 350000000.0,
        status: UnitStatus.BOOKING,
      },
      {
        perumahanId: 1,
        blok: "B",
        nomorUnit: "10A",
        tipe: "45/72",
        hargaJual: 550000000.0,
        status: UnitStatus.AVAILABLE,
      },
    ],
  });
}
