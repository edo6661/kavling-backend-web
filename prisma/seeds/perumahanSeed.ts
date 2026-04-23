import { PrismaClient } from "@prisma/client";

export async function seedPerumahan(prisma: PrismaClient) {
  await prisma.perumahan.createMany({
    data: [
      {
        nama: "Puri Safana",
        alamat: "Test Alamat",
        logo: "https://res.cloudinary.com/dbxzxfyw3/image/upload/v1776221608/LOGO_PURI_SAFANA-01_qq4lnw.png",
      },
    ],
  });
}
