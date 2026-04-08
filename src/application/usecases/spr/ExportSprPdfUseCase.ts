import PDFDocument from "pdfkit";
import type { PrismaClient } from "@prisma/client";

export class ExportSprPdfUseCase {
  constructor(private readonly db: PrismaClient) {}

  async execute(): Promise<Buffer> {
    const sprs = await this.db.spr.findMany({
      include: {
        customer: true,
        unit: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: "A4",
          layout: "landscape",
          margin: 50,
        });
        const buffers: Buffer[] = [];

        doc.on("data", (buffer) => buffers.push(buffer));
        doc.on("end", () => resolve(Buffer.concat(buffers)));

        doc
          .fontSize(18)
          .font("Helvetica-Bold")
          .text("Laporan Transaksi SPR", { align: "center" });
        doc.moveDown(2);

        let y = doc.y;

        // Header Tabel
        doc.fontSize(10).font("Helvetica-Bold");
        doc.text("No", 50, y, { width: 30 });
        doc.text("Nomor SPR", 80, y, { width: 140 });
        doc.text("Customer", 220, y, { width: 150 });
        doc.text("Unit", 370, y, { width: 130 });
        doc.text("Harga Jual", 500, y, { width: 120 });
        doc.text("Cara Bayar", 620, y, { width: 80 });
        doc.text("Status", 700, y, { width: 70 });

        doc
          .moveTo(50, y + 15)
          .lineTo(770, y + 15)
          .stroke();
        y += 25;

        // Isi Tabel
        doc.font("Helvetica");
        sprs.forEach((spr, index) => {
          if (y > 500) {
            doc.addPage({ size: "A4", layout: "landscape", margin: 50 });
            y = 50;
          }

          const hargaFmt = `Rp ${Number(spr.hargaJual).toLocaleString("id-ID")}`;
          const unitStr = spr.unit
            ? `Blok ${spr.unit.blok}-${spr.unit.nomorUnit}`
            : "-";

          doc.text(`${index + 1}`, 50, y, { width: 30 });
          doc.text(spr.nomorSpr, 80, y, { width: 140 });
          doc.text(spr.customer?.nama ?? "-", 220, y, { width: 150 });
          doc.text(unitStr, 370, y, { width: 130 });
          doc.text(hargaFmt, 500, y, { width: 120 });
          doc.text(spr.caraPembayaran, 620, y, { width: 80 });
          doc.text(spr.status, 700, y, { width: 70 });

          y += 20;
        });

        doc.end();
      } catch (error) {
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }
}
