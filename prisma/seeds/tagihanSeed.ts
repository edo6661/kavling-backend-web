import { PrismaClient, PaymentStatus, TagihanTujuan } from "@prisma/client";

export async function seedTagihan(prisma: PrismaClient) {
  await prisma.tagihan.createMany({
    data: [
      {
        noTagihan: "INV-2604-001",
        customerId: 1,
        penjualanId: 1,
        pembayaran: "Pembayaran Booking Fee",
        tujuan: TagihanTujuan.BOOKING_FEE,
        nominal: 5000000.0,
        jatuhTempo: new Date("2026-04-06"),
        status: PaymentStatus.LUNAS,
        reminderBerikutnya: null,
      },
      {
        noTagihan: "INV-2604-002",
        customerId: 2,
        penjualanId: 2,
        pembayaran: "Pembayaran Booking Fee",
        tujuan: TagihanTujuan.BOOKING_FEE,
        nominal: 5000000.0,
        jatuhTempo: new Date("2026-04-09"),
        status: PaymentStatus.LUNAS,
        reminderBerikutnya: null,
      },
      {
        noTagihan: "INV-2604-003",
        customerId: 2,
        penjualanId: 2,
        pembayaran: "Pembayaran DP Cicilan 1",
        tujuan: TagihanTujuan.DP,
        nominal: 50000000.0,
        jatuhTempo: new Date("2026-05-09"),
        status: PaymentStatus.BELUM_BAYAR,
        reminderBerikutnya: new Date("2026-05-15"),
      },
    ],
  });
}
