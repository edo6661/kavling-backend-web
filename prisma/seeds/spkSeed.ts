import { Prisma, PrismaClient, Role } from "@prisma/client";

export async function seedSpk(prisma: PrismaClient) {
  const mandor = await prisma.user.findFirst({
    where: { role: Role.MANDOR },
  });
  if (!mandor) {
    console.log("Skip seed SPK: tidak ada user mandor.");
    return;
  }

  const kavlingList = await prisma.kavling.findMany({
    take: 2,
    orderBy: [{ blok: "asc" }, { nomorUnit: "asc" }],
  });
  if (kavlingList.length === 0) {
    console.log("Skip seed SPK: tidak ada kavling.");
    return;
  }

  await prisma.spk.create({
    data: {
      noSpk: "SPK/001/SAR/IV/2026",
      tanggalSpk: new Date("2026-04-01"),
      judulPekerjaan: "Pembangunan Unit Rumah (Sample)",
      nilaiKontrak: new Prisma.Decimal(300000000),
      notesPekerjaan: "Contoh catatan pekerjaan dari seed.",
      mandorId: mandor.id,
      penjualanItems: {
        create: kavlingList.map((k) => ({ kavlingId: k.id })),
      },
    },
  });

  for (const kavling of kavlingList) {
    const penjualan = await prisma.penjualan.findFirst({
      where: { kavlingId: kavling.id, status: { not: "BATAL" } },
      orderBy: { id: "desc" },
    });
    if (!penjualan) continue;

    await prisma.progressProyek.upsert({
      where: { penjualanId: penjualan.id },
      create: { penjualanId: penjualan.id, mandorId: mandor.id },
      update: { mandorId: mandor.id },
    });
  }
}
