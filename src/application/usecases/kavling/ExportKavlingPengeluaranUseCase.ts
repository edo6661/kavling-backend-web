import ExcelJS from "exceljs";
import type { IKavlingRepository } from "../../../domain/repositories/IKavlingRepo.js";
import type { KavlingFilterDTO } from "../../../domain/dtos/KavlingDTO.js";

const CURRENCY_COLUMNS = [7, 8, 9, 10, 11, 12];

const styleHeaderRow = (worksheet: ExcelJS.Worksheet) => {
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF37474F" },
  };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };
  headerRow.height = 22;
};

export class ExportKavlingPengeluaranUseCase {
  constructor(private readonly repo: IKavlingRepository) {}

  async execute(filters?: KavlingFilterDTO): Promise<Buffer> {
    const { orderBy: _orderBy, ...exportFilters } = filters ?? {};
    const items = await this.repo.findAllForPengeluaranExport(exportFilters);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Pengeluaran Kavling");

    worksheet.columns = [
      { header: "Blok", key: "blok", width: 10 },
      { header: "Nomor Unit", key: "nomorUnit", width: 12 },
      { header: "LB (m²)", key: "luasBangunan", width: 10 },
      { header: "LT (m²)", key: "luasTanah", width: 10 },
      { header: "Cara Pembayaran", key: "caraPembayaran", width: 18 },
      { header: "Agent", key: "namaAgent", width: 22 },
      { header: "Harga", key: "harga", width: 18 },
      { header: "Biaya Notaris", key: "biayaNotaris", width: 18 },
      { header: "BPHTB", key: "biayaBphtb", width: 18 },
      { header: "PPh", key: "biayaPph", width: 18 },
      { header: "Nilai AJB", key: "nilaiAjb", width: 18 },
      { header: "Fee Marketing", key: "feeMarketing", width: 18 },
    ];

    styleHeaderRow(worksheet);

    if (items.length === 0) {
      worksheet.addRow(["Tidak ada data sesuai filter"]);
    } else {
      items.forEach((item) => {
        const row = worksheet.addRow(item);
        row.height = 20;
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          cell.border = {
            top: { style: "thin", color: { argb: "FFE0E0E0" } },
            left: { style: "thin", color: { argb: "FFE0E0E0" } },
            bottom: { style: "thin", color: { argb: "FFE0E0E0" } },
            right: { style: "thin", color: { argb: "FFE0E0E0" } },
          };
          cell.alignment = {
            vertical: "middle",
            horizontal: CURRENCY_COLUMNS.includes(colNumber) ? "right" : "center",
          };
          if (CURRENCY_COLUMNS.includes(colNumber)) {
            cell.numFmt = "#,##0";
          }
        });
      });

      const totals = items.reduce(
        (acc, item) => ({
          harga: acc.harga + item.harga,
          biayaNotaris: acc.biayaNotaris + (item.biayaNotaris ?? 0),
          biayaBphtb: acc.biayaBphtb + (item.biayaBphtb ?? 0),
          biayaPph: acc.biayaPph + (item.biayaPph ?? 0),
          nilaiAjb: acc.nilaiAjb + (item.nilaiAjb ?? 0),
          feeMarketing: acc.feeMarketing + (item.feeMarketing ?? 0),
        }),
        {
          harga: 0,
          biayaNotaris: 0,
          biayaBphtb: 0,
          biayaPph: 0,
          nilaiAjb: 0,
          feeMarketing: 0,
        },
      );

      const totalRow = worksheet.addRow({
        blok: "",
        nomorUnit: "",
        luasBangunan: "",
        luasTanah: "",
        caraPembayaran: "",
        namaAgent: "TOTAL",
        ...totals,
      });
      totalRow.font = { bold: true };
      totalRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        if (CURRENCY_COLUMNS.includes(colNumber)) {
          cell.numFmt = "#,##0";
          cell.alignment = { vertical: "middle", horizontal: "right" };
        }
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
