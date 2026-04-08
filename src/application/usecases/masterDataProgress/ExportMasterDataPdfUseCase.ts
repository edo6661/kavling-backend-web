import PDFDocument from "pdfkit";
import type { PrismaClient } from "@prisma/client";

export class ExportMasterDataPdfUseCase {
  constructor(private readonly db: PrismaClient) {}

  async execute(): Promise<Buffer> {
    const data = await this.db.masterDataProgress.findMany({
      include: {
        spr: {
          include: {
            customer: true,
            unit: true,
          },
        },
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
          .text("Laporan Progress", { align: "center" });
        doc.moveDown(2);

        let y = doc.y;

        doc.fontSize(10).font("Helvetica-Bold");
        doc.text("No", 50, y, { width: 30 });
        doc.text("Nomor SPR", 80, y, { width: 140 });
        doc.text("Customer", 220, y, { width: 130 });
        doc.text("Unit", 350, y, { width: 100 });
        doc.text("Status PPJB", 450, y, { width: 100 });
        doc.text("Pembiayaan", 550, y, { width: 100 });
        doc.text("Harga Jual", 650, y, { width: 120 });

        doc
          .moveTo(50, y + 15)
          .lineTo(770, y + 15)
          .stroke();
        y += 25;

        doc.font("Helvetica");
        data.forEach((row, index) => {
          if (y > 500) {
            doc.addPage({ size: "A4", layout: "landscape", margin: 50 });
            y = 50;
          }

          const customerName = row.spr?.customer?.nama ?? "-";
          const unitStr = row.spr?.unit
            ? `Blok ${row.spr?.unit.blok}-${row.spr?.unit.nomorUnit}`
            : "-";
          const hargaFmt = row.spr?.hargaJual
            ? `Rp ${Number(row.spr.hargaJual).toLocaleString("id-ID")}`
            : "-";
          const statusPpjb = row.statusAkadPpjb ?? "Belum Akad";
          const pembiayaan = row.pembiayaan ?? "-";

          doc.text(`${index + 1}`, 50, y, { width: 30 });
          doc.text(row.spr?.nomorSpr ?? "-", 80, y, { width: 140 });
          doc.text(customerName, 220, y, { width: 130 });
          doc.text(unitStr, 350, y, { width: 100 });
          doc.text(statusPpjb, 450, y, { width: 100 });
          doc.text(pembiayaan, 550, y, { width: 100 });
          doc.text(hargaFmt, 650, y, { width: 120 });

          y += 20;
        });

        doc.end();
      } catch (error) {
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }
}
