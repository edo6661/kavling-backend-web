import { PrismaClient } from "@prisma/client";

export async function seedNotaris(prisma: PrismaClient) {
  // Menggunakan .create() agar bisa insert data relasi PIC Notaris sekaligus
  await prisma.notaris.create({
    data: {
      nama: "Notaris Budi Santoso, S.H., M.Kn.",
      biayaAjb: 5000000.0,
      pics: {
        create: [
          {
            nama: "Agus (Staff Notaris)",
            noHp: "081233334444",
            alamat: "Kantor Notaris Budi",
          },
        ],
      },
    },
  });

  await prisma.notaris.create({
    data: {
      nama: "Notaris Siti Aminah, S.H., M.Kn.",
      biayaAjb: 4500000.0,
      pics: {
        create: [
          {
            nama: "Rini (Staff Notaris)",
            noHp: "081999998888",
            alamat: "Kantor Notaris Siti",
          },
        ],
      },
    },
  });
}
