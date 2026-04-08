import { PrismaClient, StatusAkadPpjb, Sp3r } from "@prisma/client";
import { faker } from "@faker-js/faker/locale/id_ID";

export async function seedMasterDataProgress(prisma: PrismaClient) {
  // Ambil semua SPR yang statusnya AKTIF atau DIBATALKAN untuk disimulasikan
  const sprs = await prisma.spr.findMany({
    where: { status: "AKTIF" },
    include: { unit: true },
  });

  if (sprs.length === 0) {
    console.log(
      "Lewati seed Master Data Progress karena tidak ada SPR yang AKTIF.",
    );
    return;
  }

  for (const spr of sprs) {
    // Cek apakah progress sudah terlanjur dibuat di seed SPR sebelumnya
    const existingProgress = await prisma.masterDataProgress.findUnique({
      where: { sprId: spr.id },
    });

    if (existingProgress) {
      // Jika sudah ada, kita update saja biar datanya lengkap
      const basePrice = Number(spr.hargaJual);
      const isKpr = spr.caraPembayaran.includes("KPR");

      await prisma.masterDataProgress.update({
        where: { sprId: spr.id },
        data: {
          tanggalAkadPpjb: faker.date.recent({ days: 30 }),
          statusAkadPpjb: faker.helpers.arrayElement([
            StatusAkadPpjb.NOTARIS,
            StatusAkadPpjb.DEVELOPER,
          ]),
          tanggalAkadAjbPpat: faker.date.soon({ days: 14 }),
          tanggalPembayaranPph: faker.date.soon({ days: 5 }),
          tanggalPembayaranBphtb: faker.date.soon({ days: 7 }),

          pembiayaan: isKpr ? spr.bankKpr : "Cash",
          sp3r: isKpr ? Sp3r.BANK : Sp3r.CASH_KERAS,

          hargaLebihTanah: 0,
          biayaStrategis: spr.unit?.lokasiStrategis === "Hoek" ? 15000000 : 0,
          biayaKpr: isKpr ? basePrice * 0.03 : 0,
          biayaAsuransi: isKpr ? basePrice * 0.02 : 0,

          diskonAngsuran: 0,
          diskonCashKeras: isKpr ? 0 : 10000000,
          diskonLainnya: faker.helpers.arrayElement([0, 2500000, 5000000]),

          biayaBalikNama: 3500000,
          biayaNotarisAjb: 4000000,
          biayaAppraisal: isKpr ? 1500000 : 0,
          biayaBphtb: Math.max(0, basePrice - 80000000) * 0.05,
          biayaLainLain: 1000000,

          ppn: basePrice * 0.11,
          pph: basePrice * 0.025,

          njopTanahPerMeter: faker.number.int({ min: 1500000, max: 3000000 }),
          njopBangunanPerMeter: faker.number.int({
            min: 2500000,
            max: 4000000,
          }),
          uping: faker.number.int({ min: 5000000, max: 15000000 }),
        },
      });
    } else {
      // Jika belum ada, buat baru
      const basePrice = Number(spr.hargaJual);
      const isKpr = spr.caraPembayaran.includes("KPR");

      await prisma.masterDataProgress.create({
        data: {
          sprId: spr.id,
          tanggalAkadPpjb: faker.date.recent({ days: 30 }),
          statusAkadPpjb: faker.helpers.arrayElement([
            StatusAkadPpjb.NOTARIS,
            StatusAkadPpjb.DEVELOPER,
          ]),
          tanggalAkadAjbPpat: faker.date.soon({ days: 14 }),
          tanggalPembayaranPph: faker.date.soon({ days: 5 }),
          tanggalPembayaranBphtb: faker.date.soon({ days: 7 }),

          pembiayaan: isKpr ? spr.bankKpr : "Cash",
          sp3r: isKpr ? Sp3r.BANK : Sp3r.CASH_KERAS,

          hargaLebihTanah: 0,
          biayaStrategis: spr.unit?.lokasiStrategis === "Hoek" ? 15000000 : 0,
          biayaKpr: isKpr ? basePrice * 0.03 : 0,
          biayaAsuransi: isKpr ? basePrice * 0.02 : 0,

          diskonAngsuran: 0,
          diskonCashKeras: isKpr ? 0 : 10000000,
          diskonLainnya: faker.helpers.arrayElement([0, 2500000, 5000000]),

          biayaBalikNama: 3500000,
          biayaNotarisAjb: 4000000,
          biayaAppraisal: isKpr ? 1500000 : 0,
          biayaBphtb: Math.max(0, basePrice - 80000000) * 0.05,
          biayaLainLain: 1000000,

          ppn: basePrice * 0.11,
          pph: basePrice * 0.025,

          njopTanahPerMeter: faker.number.int({ min: 1500000, max: 3000000 }),
          njopBangunanPerMeter: faker.number.int({
            min: 2500000,
            max: 4000000,
          }),
          uping: faker.number.int({ min: 5000000, max: 15000000 }),
        },
      });
    }
  }
}
