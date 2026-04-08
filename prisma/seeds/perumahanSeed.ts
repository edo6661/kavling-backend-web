import { PrismaClient } from "@prisma/client";

export async function seedPerumahan(prisma: PrismaClient) {
  await prisma.perumahan.createMany({
    data: [
      {
        nama: "Puri Safana",
        alamat: "Test Alamat",
        logo: "Test Logo",
      },
    ],
  });
}
