import ExcelJS from "exceljs";
import type { PrismaClient } from "@prisma/client";

export class ExportUnitsUseCase {
  constructor(private readonly db: PrismaClient) {}

  async execute(): Promise<Buffer> {
    const units = await this.db.unit.findMany({
      orderBy: [
        { namaPerumahan: "asc" },
        { blok: "asc" },
        { nomorUnit: "asc" },
      ],
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Data Unit");

    // Definisikan Kolom Excel
    worksheet.columns = [
      { header: "No", key: "no", width: 5 },
      { header: "Nama Perumahan", key: "namaPerumahan", width: 25 },
      { header: "Blok", key: "blok", width: 10 },
      { header: "Nomor Unit", key: "nomorUnit", width: 15 },
      { header: "Tipe", key: "tipe", width: 15 },
      { header: "Luas Tanah (m2)", key: "luasTanah", width: 18 },
      { header: "Luas Bangunan (m2)", key: "luasBangunan", width: 18 },
      { header: "Lantai", key: "lantai", width: 10 },
      { header: "Lokasi Strategis", key: "lokasiStrategis", width: 20 },
      { header: "Status", key: "status", width: 15 },
    ];

    // Isi Data
    units.forEach((unit, index) => {
      worksheet.addRow({
        no: index + 1,
        namaPerumahan: unit.namaPerumahan,
        blok: unit.blok,
        nomorUnit: unit.nomorUnit,
        tipe: unit.tipe ?? "-",
        luasTanah: unit.luasTanah ?? "-",
        luasBangunan: unit.luasBangunan ?? "-",
        lantai: unit.lantai ?? "-",
        lokasiStrategis: unit.lokasiStrategis ?? "-",
        status: unit.status,
      });
    });

    // Styling Header
    const headerRow = worksheet.getRow(1);
    if (headerRow) {
      headerRow.font = { bold: true };
      headerRow.alignment = { vertical: "middle", horizontal: "center" };
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
