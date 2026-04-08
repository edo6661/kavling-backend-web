import ExcelJS from "exceljs";
import type { PrismaClient } from "@prisma/client";

export class ExportMasterDataUseCase {
  constructor(private readonly db: PrismaClient) {}

  async execute(): Promise<Buffer> {
    const data = await this.db.masterDataProgress.findMany({
      include: {
        spr: {
          include: {
            customer: true,
            unit: true,
            bankRekeningPt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Master Data Progress");

    worksheet.columns = [
      { header: "No SPR", key: "nomorSpr", width: 20 },
      { header: "Nama Customer", key: "namaCustomer", width: 25 },
      { header: "No KTP", key: "nikKtp", width: 20 },
      { header: "No HP", key: "noHp", width: 18 },
      { header: "Nama Perumahan", key: "namaPerumahan", width: 25 },
      { header: "Blok/Unit", key: "blokUnit", width: 20 },
      { header: "Cara Pembayaran", key: "caraPembayaran", width: 20 },
      { header: "Status Akad PPJB", key: "statusAkadPpjb", width: 20 },
      { header: "Harga Jual", key: "hargaJual", width: 20 },
    ];

    data.forEach((row) => {
      worksheet.addRow({
        nomorSpr: row.spr?.nomorSpr ?? "-",
        namaCustomer: row.spr?.customer?.nama ?? "-",
        nikKtp: row.spr?.customer?.nikKtp ?? "-",
        noHp: row.spr?.customer?.noHp ?? "-",
        namaPerumahan: row.spr?.unit?.namaPerumahan ?? "-",
        blokUnit: `${row.spr?.unit?.blok ?? "-"} / ${row.spr?.unit?.nomorUnit ?? "-"}`,
        caraPembayaran: row.spr?.caraPembayaran ?? "-",
        statusAkadPpjb: row.statusAkadPpjb ?? "Belum Akad",
        hargaJual: row.spr?.hargaJual ? Number(row.spr.hargaJual) : 0,
      });
    });

    const headerRow = worksheet.getRow(1);
    if (headerRow) {
      headerRow.font = { bold: true };
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
