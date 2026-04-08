import { PrismaClient } from "@prisma/client";

export async function seedFeeAgent(prisma: PrismaClient) {
  await prisma.feeAgent.createMany({
    data: [
      {
        agentId: 1,
        bookingNominal: 1000000.0,
        bookingTanggal: new Date("2026-04-06"),
        bookingBukti: "bukti_tf_agus_booking_01.pdf",
        closingNominal: null,
        closingTanggal: null,
        closingBukti: null,
        marketingNominal: null,
        marketingTanggal: null,
        marketingBukti: null,
      },
    ],
  });
}
