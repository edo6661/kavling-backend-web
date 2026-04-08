import { PrismaClient } from "@prisma/client";

export async function seedBankRekeningPt(prisma: PrismaClient) {
  await prisma.bankRekeningPt.createMany({
    data: [
      {
        namaBank: "BCA",
        noRekening: "1234567890",
        atasNama: "PT Bumantara Group",
      },
      {
        namaBank: "Mandiri",
        noRekening: "0987654321",
        atasNama: "PT Bumantara Group",
      },
      {
        namaBank: "BRI",
        noRekening: "1122334455",
        atasNama: "PT Bumantara Group",
      },
      {
        namaBank: "BNI",
        noRekening: "5544332211",
        atasNama: "PT Bumantara Group",
      },
      {
        namaBank: "BSI",
        noRekening: "9988776655",
        atasNama: "PT Bumantara Group",
      },
    ],
  });
}
