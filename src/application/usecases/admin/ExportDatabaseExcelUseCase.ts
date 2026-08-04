import ExcelJS from "exceljs";
import type { PrismaClient } from "@prisma/client";

const SENSITIVE_COLUMNS = new Set(["password"]);
const MAX_CELL_CHARS = 32000;

type TableNameRow = Record<string, string>;

function isSafeTableName(name: string): boolean {
  return /^[a-zA-Z0-9_]+$/.test(name);
}

function resolveTableName(row: TableNameRow): string | null {
  const value =
    row.table_name ??
    row.TABLE_NAME ??
    row.Tables_in_db ??
    Object.values(row)[0];
  if (typeof value !== "string" || !value) return null;
  return value;
}

function toSheetName(tableName: string, used: Set<string>): string {
  let base = tableName.slice(0, 31);
  let candidate = base;
  let i = 1;
  while (used.has(candidate)) {
    const suffix = `_${i++}`;
    candidate = `${base.slice(0, Math.max(1, 31 - suffix.length))}${suffix}`;
  }
  used.add(candidate);
  return candidate;
}

function truncateCell(text: string): string {
  if (text.length <= MAX_CELL_CHARS) return text;
  return `${text.slice(0, MAX_CELL_CHARS)}…[truncated]`;
}

function cellValue(value: unknown): string | number | boolean | Date | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value;
  if (typeof value === "bigint") return value.toString();
  if (Buffer.isBuffer(value)) return `[binary ${value.length} bytes]`;
  if (typeof value === "object") {
    // Prisma Decimal / objek lain
    if (
      value !== null &&
      "toFixed" in value &&
      typeof (value as { toFixed: unknown }).toFixed === "function"
    ) {
      return Number((value as { toString: () => string }).toString());
    }
    return truncateCell(JSON.stringify(value));
  }
  if (typeof value === "string") return truncateCell(value);
  if (typeof value === "number" || typeof value === "boolean") return value;
  return truncateCell(String(value));
}

export class ExportDatabaseExcelUseCase {
  constructor(private readonly db: PrismaClient) {}

  async execute(): Promise<Buffer> {
    const tables = await this.db.$queryRaw<TableNameRow[]>`
      SELECT TABLE_NAME AS table_name
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Kavling Backend";
    workbook.created = new Date();

    const usedSheetNames = new Set<string>();

    for (const row of tables) {
      const tableName = resolveTableName(row);
      if (!tableName || !isSafeTableName(tableName)) continue;

      const rows = await this.db.$queryRawUnsafe<Record<string, unknown>[]>(
        `SELECT * FROM \`${tableName}\``,
      );

      const sheet = workbook.addWorksheet(toSheetName(tableName, usedSheetNames));

      if (rows.length === 0) {
        sheet.addRow(["(tabel kosong)"]);
        continue;
      }

      const firstRow = rows[0]!;
      const columns = Object.keys(firstRow).filter(
        (col) => !SENSITIVE_COLUMNS.has(col.toLowerCase()),
      );

      sheet.columns = columns.map((col) => ({
        header: col,
        key: col,
        width: Math.min(40, Math.max(12, col.length + 2)),
      }));

      for (const dataRow of rows) {
        const excelRow: Record<string, string | number | boolean | Date | null> =
          {};
        for (const col of columns) {
          excelRow[col] = cellValue(dataRow[col]);
        }
        sheet.addRow(excelRow);
      }

      const headerRow = sheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.alignment = { vertical: "middle", horizontal: "center" };
    }

    if (workbook.worksheets.length === 0) {
      workbook.addWorksheet("empty").addRow(["Tidak ada tabel"]);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
