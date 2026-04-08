import PDFDocument from "pdfkit";
import type { PrismaClient } from "@prisma/client";

export class ExportUnitsPdfUseCase {
  constructor(private readonly db: PrismaClient) {}

  async execute(): Promise<Buffer> {
    const units = await this.db.unit.findMany({
      orderBy: [
        { namaPerumahan: "asc" },
        { blok: "asc" },
        { nomorUnit: "asc" },
      ],
    });

    return new Promise((resolve, reject) => {
      try {
        // Menggunakan ukuran A4 landscape agar tabel muat
        const doc = new PDFDocument({
          size: "A4",
          layout: "landscape",
          margin: 50,
        });
        const buffers: Buffer[] = [];

        doc.on("data", (buffer) => buffers.push(buffer));
        doc.on("end", () => resolve(Buffer.concat(buffers)));

        // Header Laporan
        doc
          .fontSize(18)
          .font("Helvetica-Bold")
          .text("Laporan Unit", { align: "center" });
        doc.moveDown(2);

        // Pengaturan Posisi Tabel
        const startY = doc.y;
        let y = startY;

        // Header Tabel
        doc.fontSize(10).font("Helvetica-Bold");
        doc.text("No", 50, y, { width: 30 });
        doc.text("Perumahan", 80, y, { width: 180 });
        doc.text("Blok - No", 260, y, { width: 80 });
        doc.text("Tipe", 340, y, { width: 70 });
        doc.text("L. Tanah", 410, y, { width: 60 });
        doc.text("L. Bangunan", 470, y, { width: 80 });
        doc.text("Lokasi Strategis", 550, y, { width: 120 });
        doc.text("Status", 670, y, { width: 100 });

        // Garis Bawah Header
        doc
          .moveTo(50, y + 15)
          .lineTo(770, y + 15)
          .stroke();
        y += 25;

        // Isi Tabel
        doc.font("Helvetica");
        units.forEach((unit, index) => {
          // Jika halaman sudah penuh, buat halaman baru
          if (y > 500) {
            doc.addPage({ size: "A4", layout: "landscape", margin: 50 });
            y = 50;
          }

          doc.text(`${index + 1}`, 50, y, { width: 30 });
          doc.text(unit.namaPerumahan, 80, y, { width: 180 });
          doc.text(`${unit.blok} - ${unit.nomorUnit}`, 260, y, { width: 80 });
          doc.text(unit.tipe ?? "-", 340, y, { width: 70 });
          doc.text(`${unit.luasTanah ?? "-"} m2`, 410, y, { width: 60 });
          doc.text(`${unit.luasBangunan ?? "-"} m2`, 470, y, { width: 80 });
          doc.text(unit.lokasiStrategis ?? "-", 550, y, { width: 120 });
          doc.text(unit.status, 670, y, { width: 100 });

          y += 20;
        });

        doc.end();
      } catch (error) {
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }
}
