import { PrismaClient } from "@prisma/client";
import { TagihanRepository } from "../src/domain/repositories/tagihanRepo.js";

const db = new PrismaClient();
const repo = new TagihanRepository(db);

async function main() {
  const result = await repo.findWithOffsetPagination(1, 10, {
    status: "MENUNGGU_KONFIRMASI",
  });
  const row = result.items.find((i) => i.namaCustomer.includes("Muhammad Ridho"));
  console.log(
    JSON.stringify(
      row
        ? {
            id: row.id,
            namaAgent: row.namaAgent,
            namaCustomer: row.namaCustomer,
            blok: row.blok,
            nomorUnit: row.nomorUnit,
          }
        : { message: "row not in first page", total: result.items.length },
      null,
      2,
    ),
  );
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
