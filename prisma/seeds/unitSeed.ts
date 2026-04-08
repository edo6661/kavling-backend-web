import { PrismaClient, UnitStatus } from "@prisma/client";

export async function seedUnits(prisma: PrismaClient) {
  const units = [];
  const lokasiStrategisOptions = [
    "Dekat Taman",
    "Hoek",
    "Jalan Utama",
    "Standar",
  ];
  const bloks = ["A", "B", "C"];

  for (const blok of bloks) {
    for (let i = 1; i <= 5; i++) {
      const isGenap = i % 2 === 0;
      const unit = await prisma.unit.create({
        data: {
          namaPerumahan: "Bumantara Residence",
          blok: blok,
          nomorUnit: i.toString().padStart(3, "0"),
          tipe: isGenap ? "36/60" : "45/90",
          luasTanah: isGenap ? 60 : 90,
          luasBangunan: isGenap ? 36 : 45,
          lantai: isGenap ? 1 : 2,
          lokasiStrategis:
            lokasiStrategisOptions[
              (i + blok.charCodeAt(0)) % lokasiStrategisOptions.length
            ],
          status: UnitStatus.TERSEDIA,
        },
      });
      units.push(unit);
    }
  }
  return units;
}
