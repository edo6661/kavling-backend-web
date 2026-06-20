import { PrismaClient } from "@prisma/client";
import { STANDARD_PEKERJAAN_INFRA_ITEMS } from "../../src/constants/pekerjaanInfra.js";

export async function seedPekerjaanInfra(prisma: PrismaClient) {
  console.log("Seeding master Pekerjaan Infra (standar Pak Arga)...");

  for (const item of STANDARD_PEKERJAAN_INFRA_ITEMS) {
    await prisma.pekerjaanInfra.upsert({
      where: { nama: item.nama },
      create: {
        nama: item.nama,
        urutan: item.urutan,
        kategori: item.kategori,
        isActive: true,
      },
      update: {
        urutan: item.urutan,
        kategori: item.kategori,
        isActive: true,
      },
    });
  }

  console.log(`✓ ${STANDARD_PEKERJAAN_INFRA_ITEMS.length} item pekerjaan infra siap.`);
}

export async function seedZona(prisma: PrismaClient) {
  console.log("Seeding master Zona...");

  await prisma.zona.upsert({
    where: { id: 1 },
    create: {
      nama: "HGB 271",
      hgb: "HGB 271 (26 JULI 2028)",
      luas: "13.880 M2",
      deskripsi: "Terdiri dari 30 Ruko dan 78 Kavling tipe 68/60",
    },
    update: {
      nama: "HGB 271",
      hgb: "HGB 271 (26 JULI 2028)",
      luas: "13.880 M2",
      deskripsi: "Terdiri dari 30 Ruko dan 78 Kavling tipe 68/60",
    },
  });

  console.log("✓ Zona contoh siap.");
}
