import type { PrismaClient } from "@prisma/client";
import type { CloudinaryService } from "../../../infrastructure/external/CloudinaryService.js";
import type { GenerateSprPdfUseCase } from "./GenerateSprPdfUseCase.js";
import { NotFoundError } from "../../../domain/errors/NotFoundError.js";
export class RegenerateSprUseCase {
  constructor(
    private readonly db: PrismaClient,
    private readonly cloudinaryService: CloudinaryService,
    private readonly generateSprPdfUseCase: GenerateSprPdfUseCase,
  ) {}
  async execute(noTransaksi: string) {
    const penjualanId = await this.db.$transaction(async (tx) => {
      const penjualan = await tx.penjualan.findUnique({
        where: { noTransaksi },
        include: { tagihan: true },
      });
      if (!penjualan) {
        throw new NotFoundError("Data Penjualan tidak ditemukan");
      }
      const bfTagihan = penjualan.tagihan.find((t) =>
        t.pembayaran.toLowerCase().includes("booking"),
      );
      if (
        !bfTagihan &&
        penjualan.bookingFee &&
        Number(penjualan.bookingFee) > 0
      ) {
        await tx.tagihan.create({
          data: {
            noTagihan: `INV-BF-${penjualan.noTransaksi}`,
            customerId: penjualan.customerId,
            penjualanId: penjualan.id,
            pembayaran: "Booking Fee",
            nominal: penjualan.bookingFee,
            jatuhTempo: penjualan.tanggal,
            status: "BELUM_BAYAR",
          },
        });
      }
      const dpTagihan = penjualan.tagihan.find(
        (t) =>
          t.pembayaran.toLowerCase().includes("down payment") ||
          t.pembayaran.toLowerCase().includes("dp"),
      );
      if (
        !dpTagihan &&
        penjualan.dp &&
        Number(penjualan.dp) > 0 &&
        (penjualan.caraPembayaran === "KPR" ||
          penjualan.caraPembayaran === "CASH_BERTAHAP")
      ) {
        const dpDueDate = new Date(penjualan.tanggal);
        dpDueDate.setDate(dpDueDate.getDate() + 14);
        await tx.tagihan.create({
          data: {
            noTagihan: `INV-DP-${penjualan.noTransaksi}`,
            customerId: penjualan.customerId,
            penjualanId: penjualan.id,
            pembayaran: "Down Payment (DP)",
            nominal: penjualan.dp,
            jatuhTempo: dpDueDate,
            status: "BELUM_BAYAR",
          },
        });
      }
      return penjualan.id;
    });
    const pdfBuffer = await this.generateSprPdfUseCase.execute(penjualanId);
    const sprUrl = await this.cloudinaryService.uploadFile(
      pdfBuffer,
      "bumantara/spr",
    );
    return await this.db.penjualan.update({
      where: { id: penjualanId },
      data: { fileSpr: sprUrl },
    });
  }
}
