import ExcelJS from "exceljs";
import type { PrismaClient } from "@prisma/client";

export class ExportFinanceReportUseCase {
  constructor(private readonly db: PrismaClient) {}

  async execute(): Promise<Buffer> {
    const payments = await this.db.sprPayment.findMany({
      include: {
        spr: {
          include: {
            customer: true,
            unit: true,
          },
        },
      },
      orderBy: [{ statusPembayaran: "asc" }, { jatuhTempo: "desc" }],
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Laporan Keuangan Global");

    worksheet.columns = [
      { header: "No", key: "no", width: 5 },
      { header: "Status", key: "status", width: 15 },
      { header: "Nama Customer", key: "customer", width: 25 },
      { header: "Unit", key: "unit", width: 20 },
      { header: "Keterangan Tagihan", key: "keterangan", width: 25 },
      { header: "Nilai Tagihan", key: "nilai", width: 18 },
      { header: "Jatuh Tempo", key: "jatuhTempo", width: 15 },
      { header: "Tanggal Bayar/Verifikasi", key: "tanggalBayar", width: 20 },
      { header: "Nomor SPR", key: "nomorSpr", width: 20 },
    ];

    payments.forEach((p, index) => {
      worksheet.addRow({
        no: index + 1,
        status: p.statusPembayaran,
        customer: p.spr.customer?.nama ?? "-",
        unit: p.spr.unit ? `${p.spr.unit.blok}-${p.spr.unit.nomorUnit}` : "-",
        keterangan: p.keterangan,
        nilai: Number(p.nilai),
        jatuhTempo: p.jatuhTempo.toISOString().slice(0, 10),
        tanggalBayar:
          p.statusPembayaran === "LUNAS"
            ? p.updatedAt.toISOString().slice(0, 10)
            : "-",
        nomorSpr: p.spr.nomorSpr,
      });
    });

    const headerRow = worksheet.getRow(1);
    if (headerRow) {
      headerRow.font = { bold: true, color: { argb: "FFFFFF" } };
      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "2563EB" },
      };
    }

    worksheet.getColumn("nilai").numFmt = '"Rp"#,##0';

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        const statusCell = row.getCell("status");
        if (statusCell.value === "LUNAS") {
          statusCell.font = { color: { argb: "10B981" }, bold: true };
        } else {
          statusCell.font = { color: { argb: "F59E0B" }, bold: true };
        }
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
