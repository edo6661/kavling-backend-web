import PDFDocument from "pdfkit";
import type { PrismaClient } from "@prisma/client";
import { NotFoundError } from "../../../domain/errors/NotFoundError.js";
import { AppError } from "../../../domain/errors/AppError.js";
import { StatusCodes } from "http-status-codes";

export class GenerateKwitansiPdfUseCase {
  constructor(private readonly db: PrismaClient) {}

  async execute(paymentId: number): Promise<Buffer> {
    const payment = await this.db.sprPayment.findUnique({
      where: { id: paymentId },
      include: {
        spr: {
          include: {
            customer: true,
            unit: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundError("Data pembayaran tidak ditemukan");
    }
    if (payment.statusPembayaran !== "LUNAS") {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "Kwitansi hanya dapat dicetak untuk pembayaran yang sudah LUNAS",
      );
    }

    return new Promise((resolve, reject) => {
      try {
        // Menggunakan ukuran A5 Landscape yang umum untuk Kwitansi
        const doc = new PDFDocument({
          size: "A5",
          layout: "landscape",
          margin: 40,
        });
        const buffers: Buffer[] = [];

        doc.on("data", (buffer) => buffers.push(buffer));
        doc.on("end", () => resolve(Buffer.concat(buffers)));

        // Header Kwitansi
        doc
          .fontSize(16)
          .font("Helvetica-Bold")
          .text("KWITANSI PEMBAYARAN", { align: "center", underline: true });
        doc.moveDown(0.5);

        doc
          .fontSize(10)
          .font("Helvetica")
          .text(`No. Kwitansi : KWT-${payment.spr.nomorSpr}-${payment.id}`, {
            align: "center",
          });
        doc.moveDown(2);

        const startX = 50;
        let y = doc.y;
        const labelWidth = 140;

        const drawField = (label: string, value: string) => {
          doc.font("Helvetica").text(label, startX, y);
          doc.text(":", startX + labelWidth, y);
          doc
            .font("Helvetica-Bold")
            .text(value, startX + labelWidth + 15, y, { width: 350 });
          y = doc.y + 15;
        };

        const customerName = payment.spr.customer?.nama ?? "-";
        const unitName = payment.spr.unit
          ? `${payment.spr.unit.namaPerumahan} Blok ${payment.spr.unit.blok} No. ${payment.spr.unit.nomorUnit}`
          : "-";
        const hargaFmt = `Rp ${Number(payment.nilai).toLocaleString("id-ID")}`;

        drawField("Telah terima dari", customerName);
        drawField(
          "Untuk Pembayaran",
          `${payment.keterangan} - Unit ${unitName}`,
        );
        drawField("Jumlah", hargaFmt);

        y += 20;

        // Area Tanda Tangan
        const dateStr = payment.updatedAt.toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        });

        doc.font("Helvetica").text(`Tangerang, ${dateStr}`, 400, y, {
          align: "center",
          width: 150,
        });
        doc.text("Penerima,", 400, y + 15, { align: "center", width: 150 });

        doc
          .moveTo(400, y + 80)
          .lineTo(550, y + 80)
          .stroke();
        doc.text("( Bagian Keuangan )", 400, y + 85, {
          align: "center",
          width: 150,
        });

        doc.end();
      } catch (error) {
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }
}
