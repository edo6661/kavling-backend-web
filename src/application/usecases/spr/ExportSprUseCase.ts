import ExcelJS from "exceljs";
import type { PrismaClient } from "@prisma/client";

export class ExportSprUseCase {
  constructor(private readonly db: PrismaClient) {}

  async execute(): Promise<Buffer> {
    const sprs = await this.db.spr.findMany({
      include: {
        customer: true,
        unit: true,
        payments: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Data SPR");

    worksheet.columns = [
      { header: "No", key: "no", width: 5 },
      { header: "Tanggal Dibuat", key: "tanggal", width: 15 },
      { header: "Nomor SPR", key: "nomorSpr", width: 25 },
      { header: "Nama Customer", key: "namaCustomer", width: 25 },
      { header: "Unit (Blok - No)", key: "unit", width: 20 },
      { header: "Harga Jual", key: "hargaJual", width: 20 },
      { header: "Cara Bayar", key: "caraBayar", width: 15 },
      { header: "Status", key: "status", width: 15 },
      { header: "Total Terbayar", key: "totalTerbayar", width: 20 },
      { header: "Sisa Tagihan (Belum Lunas)", key: "sisaTagihan", width: 25 },
    ];

    sprs.forEach((spr, index) => {
      // Hitung total terbayar dan sisa tagihan dari relasi payments
      const totalTerbayar = spr.payments
        .filter((p) => p.statusPembayaran === "LUNAS")
        .reduce((sum, p) => sum + Number(p.nilai), 0);

      const sisaTagihan = spr.payments
        .filter((p) => p.statusPembayaran !== "LUNAS")
        .reduce((sum, p) => sum + Number(p.nilai), 0);

      worksheet.addRow({
        no: index + 1,
        tanggal: spr.createdAt.toISOString().slice(0, 10),
        nomorSpr: spr.nomorSpr,
        namaCustomer: spr.customer?.nama ?? "-",
        unit: spr.unit
          ? `${spr.unit.namaPerumahan} Blok ${spr.unit.blok}-${spr.unit.nomorUnit}`
          : "-",
        hargaJual: Number(spr.hargaJual),
        caraBayar: spr.caraPembayaran,
        status: spr.status,
        totalTerbayar: totalTerbayar,
        sisaTagihan: sisaTagihan,
      });
    });

    const headerRow = worksheet.getRow(1);
    if (headerRow) {
      headerRow.font = { bold: true };
      headerRow.alignment = { vertical: "middle", horizontal: "center" };
    }

    worksheet.getColumn("hargaJual").numFmt = '"Rp"#,##0';
    worksheet.getColumn("totalTerbayar").numFmt = '"Rp"#,##0';
    worksheet.getColumn("sisaTagihan").numFmt = '"Rp"#,##0';

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
