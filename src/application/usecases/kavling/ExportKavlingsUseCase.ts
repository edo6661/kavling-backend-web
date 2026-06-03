import ExcelJS from "exceljs";
import type { UnitStatus } from "@prisma/client";
import type { IKavlingRepository } from "../../../domain/repositories/IKavlingRepo.js";
import type { KavlingFilterDTO } from "../../../domain/dtos/KavlingDTO.js";
import type { KavlingEntity } from "../../../domain/entities/Kavling.js";
import { compareKavlingBlokUnit } from "../../../utils/kavlingSort.js";

const STATUS_LABEL: Record<UnitStatus, string> = {
  AVAILABLE: "Available",
  BOOKING: "Booking",
  TERJUAL: "Terjual",
  HOLD: "Hold",
};

const STATUS_ROW_FILL: Record<UnitStatus, string> = {
  AVAILABLE: "FFE8F5E9",
  BOOKING: "FFE3F2FD",
  TERJUAL: "FFD1FAE5",
  HOLD: "FFFFF8E1",
};

const STATUS_STATUS_FILL: Record<UnitStatus, string> = {
  AVAILABLE: "FF4CAF50",
  BOOKING: "FF2196F3",
  TERJUAL: "FF00897B",
  HOLD: "FFFFC107",
};

const STATUS_FONT: Record<UnitStatus, string> = {
  AVAILABLE: "FF1B5E20",
  BOOKING: "FF0D47A1",
  TERJUAL: "FF004D40",
  HOLD: "FFE65100",
};

const sanitizeSheetName = (name: string): string => {
  const cleaned = name.replace(/[\\/?*[\]:]/g, "-").slice(0, 31);
  return cleaned.length > 0 ? cleaned : "Sheet";
};

const groupByLb = (items: KavlingEntity[]): Map<number, KavlingEntity[]> => {
  const groups = new Map<number, KavlingEntity[]>();
  for (const item of items) {
    const lb = item.luasBangunan;
    const bucket = groups.get(lb);
    if (bucket) {
      bucket.push(item);
    } else {
      groups.set(lb, [item]);
    }
  }
  return groups;
};

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

const appendDataRows = (worksheet: ExcelJS.Worksheet, items: KavlingEntity[]) => {
  items.forEach((item) => {
    const status = item.status as UnitStatus;
    const row = worksheet.addRow({
      blok: item.blok,
      nomorUnit: item.nomorUnit,
      luasTanah: item.luasTanah,
      namaTipe: item.namaTipe,
      hargaDasar: item.hargaDasar,
      status: STATUS_LABEL[status] ?? item.status,
    });

    row.height = 20;
    const rowFill = STATUS_ROW_FILL[status] ?? "FFFFFFFF";

    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: rowFill },
      };
      cell.border = {
        top: { style: "thin", color: { argb: "FFE0E0E0" } },
        left: { style: "thin", color: { argb: "FFE0E0E0" } },
        bottom: { style: "thin", color: { argb: "FFE0E0E0" } },
        right: { style: "thin", color: { argb: "FFE0E0E0" } },
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };

      if (colNumber === 5) {
        cell.numFmt = "#,##0";
        cell.alignment = { vertical: "middle", horizontal: "right" };
      }

      if (colNumber === 6) {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: STATUS_STATUS_FILL[status] ?? "FF9E9E9E" },
        };
      } else {
        cell.font = {
          color: { argb: STATUS_FONT[status] ?? "FF212121" },
        };
      }
    });
  });
};

const addLegendSheet = (workbook: ExcelJS.Workbook) => {
  const legendSheet = workbook.addWorksheet("Keterangan Status");
  legendSheet.columns = [
    { header: "Status", key: "status", width: 16 },
    { header: "Keterangan", key: "keterangan", width: 28 },
  ];
  const legendHeader = legendSheet.getRow(1);
  legendHeader.font = { bold: true };
  legendHeader.alignment = { horizontal: "center" };

  const legendRows: { status: UnitStatus; keterangan: string }[] = [
    { status: "AVAILABLE", keterangan: "Unit tersedia / belum terjual" },
    { status: "BOOKING", keterangan: "Unit dalam proses booking" },
    { status: "TERJUAL", keterangan: "Unit sudah terjual" },
    { status: "HOLD", keterangan: "Unit ditahan (hold)" },
  ];

  legendRows.forEach(({ status, keterangan }) => {
    const row = legendSheet.addRow({
      status: STATUS_LABEL[status],
      keterangan,
    });
    const statusCell = row.getCell(1);
    statusCell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    statusCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: STATUS_STATUS_FILL[status] },
    };
    statusCell.alignment = { horizontal: "center" };
    row.getCell(2).alignment = { vertical: "middle" };
  });
};

export class ExportKavlingsUseCase {
  constructor(private readonly repo: IKavlingRepository) {}

  async execute(filters?: KavlingFilterDTO): Promise<Buffer> {
    const { orderBy: _orderBy, ...exportFilters } = filters ?? {};
    const items = await this.repo.findAll(exportFilters);

    const workbook = new ExcelJS.Workbook();
    const grouped = groupByLb(items);
    const lbValues = [...grouped.keys()].sort((a, b) => a - b);

    const columnDefs = [
      { header: "Blok", key: "blok", width: 10 },
      { header: "Nomor Unit", key: "nomorUnit", width: 12 },
      { header: "LT (m²)", key: "luasTanah", width: 10 },
      { header: "Tipe", key: "namaTipe", width: 18 },
      { header: "Harga", key: "hargaDasar", width: 18 },
      { header: "Status Kavling", key: "status", width: 16 },
    ];

    if (lbValues.length === 0) {
      const emptySheet = workbook.addWorksheet("Data Kavling");
      emptySheet.columns = columnDefs;
      styleHeaderRow(emptySheet);
      emptySheet.addRow(["Tidak ada data sesuai filter"]);
    } else {
      const usedNames = new Set<string>();

      for (const lb of lbValues) {
        const sheetItems = grouped.get(lb) ?? [];
        sheetItems.sort((a, b) => compareKavlingBlokUnit(a, b, "asc"));

        let sheetName = sanitizeSheetName(`LB ${lb}`);
        if (usedNames.has(sheetName)) {
          let suffix = 2;
          while (usedNames.has(`${sheetName.slice(0, 28)} (${suffix})`)) {
            suffix += 1;
          }
          sheetName = sanitizeSheetName(`LB ${lb} (${suffix})`);
        }
        usedNames.add(sheetName);

        const worksheet = workbook.addWorksheet(sheetName);
        worksheet.columns = columnDefs;
        styleHeaderRow(worksheet);
        appendDataRows(worksheet, sheetItems);
      }
    }

    addLegendSheet(workbook);

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
