import PDFDocument from "pdfkit";
import type { PrismaClient } from "@prisma/client";

export class ExportCustomersPdfUseCase {
  constructor(private readonly db: PrismaClient) {}

  async execute(): Promise<Buffer> {
    const customers = await this.db.customer.findMany({
      orderBy: { nama: "asc" },
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
          .text("Laporan Customer", { align: "center" });
        doc.moveDown(2);

        const startY = doc.y;
        let y = startY;

        // Header Tabel
        doc.fontSize(10).font("Helvetica-Bold");
        doc.text("No", 50, y, { width: 30 });
        doc.text("NIK", 80, y, { width: 120 });
        doc.text("Nama", 200, y, { width: 150 });
        doc.text("No HP", 350, y, { width: 100 });
        doc.text("Pekerjaan", 450, y, { width: 120 });
        doc.text("Alamat", 570, y, { width: 200 });

        doc
          .moveTo(50, y + 15)
          .lineTo(770, y + 15)
          .stroke();
        y += 25;

        // Isi Tabel
        doc.font("Helvetica");
        customers.forEach((c, index) => {
          if (y > 500) {
            doc.addPage({ size: "A4", layout: "landscape", margin: 50 });
            y = 50;
          }

          doc.text(`${index + 1}`, 50, y, { width: 30 });
          doc.text(c.nikKtp, 80, y, { width: 120 });
          doc.text(c.nama, 200, y, { width: 150 });
          doc.text(c.noHp, 350, y, { width: 100 });
          doc.text(c.pekerjaan ?? "-", 450, y, { width: 120 });

          // Truncate alamat agar rapi di PDF
          const alamatStr =
            c.alamatKtp.length > 50
              ? c.alamatKtp.substring(0, 47) + "..."
              : c.alamatKtp;
          doc.text(alamatStr, 570, y, { width: 200 });

          y += 20;
        });

        doc.end();
      } catch (error) {
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }
}
