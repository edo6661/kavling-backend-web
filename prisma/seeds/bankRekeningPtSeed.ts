import { PrismaClient } from "@prisma/client";

export async function seedBankRekeningPt(prisma: PrismaClient) {
  await prisma.bankRekeningPt.createMany({
    data: [
      {
        perumahanId: 1,
        namaBank: "BSI",
        noRekening: "7326575644",
        atasNama: "PT. Bintang Safana Gajah",
      },
      {
        perumahanId: 1,
        namaBank: "BSI",
        noRekening: "7326573692",
        atasNama: "PT. Bintang Safana Mahligai",
      },
    ],
  });
}
