import { PrismaClient } from "@prisma/client";
import { TagihanMapper } from "../src/infrastructure/mapper/TagihanMapper.js";

const db = new PrismaClient();

const tagihanIncludeRelations = {
  customer: { select: { nama: true } },
  penjualan: {
    include: {
      agent: { select: { nama: true } },
      kavling: {
        include: {
          perumahan: { select: { nama: true } },
          rekeningTujuan: true,
        },
      },
      rekeningTujuan: true,
    },
  },
} as const;

async function main() {
  const t = await db.tagihan.findFirst({
    where: {
      customer: { nama: { contains: "Muhammad Ridho" } },
      status: "MENUNGGU_KONFIRMASI",
      penjualan: { kavling: { blok: "AA3", nomorUnit: "1" } },
    },
    include: tagihanIncludeRelations,
  });

  const mapped = t ? TagihanMapper.toDomain(t) : null;

  console.log(
    JSON.stringify(
      {
        id: mapped?.id,
        namaAgent: mapped?.namaAgent,
        namaCustomer: mapped?.namaCustomer,
        pembayaran: mapped?.pembayaran,
      },
      null,
      2,
    ),
  );
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
