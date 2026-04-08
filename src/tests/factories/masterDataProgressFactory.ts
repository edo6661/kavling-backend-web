import type { Prisma } from "@prisma/client";
import { PrismaClient, StatusAkadPpjb } from "@prisma/client";
import { faker } from "@faker-js/faker/locale/id_ID";

const prisma = new PrismaClient();

type MasterDataProgressFactoryArgs =
  Partial<Prisma.MasterDataProgressUncheckedCreateInput> & {
    sprId: number;
  };

export const MasterDataProgressFactory = {
  async create(overrides: MasterDataProgressFactoryArgs) {
    const basePrice = 450000000;

    return await prisma.masterDataProgress.create({
      data: {
        tanggalAkadPpjb: faker.date.recent(),
        statusAkadPpjb: StatusAkadPpjb.DEVELOPER,
        tanggalAkadAjbPpat: faker.date.recent(),
        tanggalPembayaranPph: faker.date.recent(),
        tanggalPembayaranBphtb: faker.date.recent(),
        pembiayaan: "KPR BTN",
        sp3r: `SP3R-${faker.string.alphanumeric(5).toUpperCase()}`,
        hargaLebihTanah: 15000000,
        biayaStrategis: 5000000,
        biayaKpr: 15000000,
        biayaAsuransi: 5000000,
        diskonAngsuran: 0,
        diskonCashKeras: 0,
        diskonLainnya: 0,
        biayaBalikNama: 3500000,
        biayaNotarisAjb: 4000000,
        biayaAppraisal: 1500000,
        biayaBphtb: 18000000,
        biayaLainLain: 1000000,
        ppn: basePrice * 0.11,
        pph: basePrice * 0.025,
        njopTanahPerMeter: 2000000,
        njopBangunanPerMeter: 3000000,
        uping: 0,
        closingFee: 2500000,
        tanggalTransferClosingFee: faker.date.recent(),
        buktiTransferClosingFee: `closing-fee-${faker.string.uuid()}.jpg`,
        marketingFee: 5000000,
        tanggalTransferMarketingFee: faker.date.recent(),
        buktiTransferMarketingFee: `marketing-fee-${faker.string.uuid()}.jpg`,
        ...overrides,
      },
    });
  },
};
