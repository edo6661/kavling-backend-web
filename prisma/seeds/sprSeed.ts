import {
  PrismaClient,
  SprStatus,
  CaraPembayaran,
  PaymentStatus,
  UnitStatus,
  StatusAkadPpjb,
  Sp3r,
} from "@prisma/client";
import { faker } from "@faker-js/faker/locale/id_ID";

export async function seedSprs(prisma: PrismaClient) {
  const customers = await prisma.customer.findMany();
  const units = await prisma.unit.findMany({
    where: { status: UnitStatus.TERSEDIA },
  });
  const marketing = await prisma.user.findFirst({
    where: { role: "MARKETING" },
  });
  const bank = await prisma.bankRekeningPt.findFirst();

  if (customers.length < 3 || units.length < 3 || !marketing || !bank) {
    console.log(
      "Lewati seed SPR karena data relasi belum lengkap (minimal butuh 3 customer & 3 unit tersedia).",
    );
    return;
  }

  const skenarioSpr = [
    {
      status: SprStatus.AKTIF,
      caraPembayaran: CaraPembayaran.KPR_BTN,
      bankKpr: "BTN",
      paymentStatus: PaymentStatus.LUNAS, // Booking fee lunas
      buatProgress: true,
    },
    {
      status: SprStatus.DRAFT,
      caraPembayaran: CaraPembayaran.CASH_KERAS,
      bankKpr: null,
      paymentStatus: PaymentStatus.BELUM_BAYAR, // Draft, belum bayar sama sekali
      buatProgress: false,
    },
    {
      status: SprStatus.DIBATALKAN,
      caraPembayaran: CaraPembayaran.KPR_BRI,
      bankKpr: "BRI",
      paymentStatus: PaymentStatus.LUNAS,
      buatProgress: false,
      alasanBatal: "BI Checking ditolak oleh pihak Bank.",
    },
  ];

  for (let i = 0; i < skenarioSpr.length; i++) {
    const skenario = skenarioSpr[i];
    const unit = units[i];
    const basePrice = i % 2 === 0 ? 450000000 : 650000000;

    const spr = await prisma.spr.create({
      data: {
        nomorSpr: `SPR-2026-${faker.string.numeric(4)}`,
        customerId: customers[i].id,
        unitId: unit.id,
        marketingUserId: marketing.id,
        bankRekeningPtId: bank.id,
        hargaJual: basePrice,
        diskonPenjualan: 10000000,
        paketPromosi: "Free AC & Kanopi",
        caraPembayaran: skenario.caraPembayaran,
        bankKpr: skenario.bankKpr,
        nilaiPengajuanKpr: skenario.bankKpr ? basePrice - 50000000 : 0,
        ttdPemesan: "ttd-pemesan.png",
        ttdMarketing: "ttd-marketing.png",
        ttdSupervisor: "ttd-spv.png",
        ttdManager: "ttd-manager.png",
        ttdSalesAdmin: "ttd-admin.png",
        tanggalTtdPemesan: new Date(),
        tanggalTtdMarketing: new Date(),
        tanggalTtdSupervisor: new Date(),
        tanggalTtdManager: new Date(),
        tanggalTtdSalesAdmin: new Date(),
        status: skenario.status,
        alasanBatal: skenario.alasanBatal,
        agent: "Budi Agent Independen",
      },
    });

    // Jika dibatalkan, unit harusnya kembali TERSEDIA. Jika tidak, BOOKING/TERJUAL.
    const finalUnitStatus =
      skenario.status === SprStatus.DIBATALKAN
        ? UnitStatus.TERSEDIA
        : skenario.status === SprStatus.AKTIF
          ? UnitStatus.TERJUAL
          : UnitStatus.BOOKING;

    await prisma.unit.update({
      where: { id: unit.id },
      data: { status: finalUnitStatus },
    });

    await prisma.sprPayment.createMany({
      data: [
        {
          sprId: spr.id,
          keterangan: "Booking Fee",
          jatuhTempo: faker.date.recent(),
          nilai: 5000000,
          buktiTransfer:
            skenario.paymentStatus === PaymentStatus.LUNAS
              ? "bukti-bf.jpg"
              : null,
          statusPembayaran: skenario.paymentStatus,
        },
        {
          sprId: spr.id,
          keterangan: "DP 1",
          jatuhTempo: faker.date.soon({ days: 14 }),
          nilai: 20000000,
          buktiTransfer: null,
          statusPembayaran: PaymentStatus.BELUM_BAYAR,
        },
      ],
    });

    if (skenario.buatProgress) {
      await prisma.masterDataProgress.create({
        data: {
          sprId: spr.id,
          tanggalAkadPpjb: new Date(),
          statusAkadPpjb: StatusAkadPpjb.NOTARIS,
          pembiayaan: spr.bankKpr,
          sp3r: Sp3r.BANK,
          hargaLebihTanah: 0,
          biayaStrategis: unit.lokasiStrategis === "Hoek" ? 15000000 : 0,
          biayaAsuransi: basePrice * 0.05,
          biayaBalikNama: 3500000,
          biayaNotarisAjb: 4000000,
          biayaAppraisal: 1500000,
          njopTanahPerMeter: 2000000,
          njopBangunanPerMeter: 3000000,
        },
      });
    }
  }
}
