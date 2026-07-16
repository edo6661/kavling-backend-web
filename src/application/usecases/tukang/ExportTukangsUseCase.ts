import ExcelJS from "exceljs";
import type { TukangRepository } from "../../../domain/repositories/tukangRepo.js";
import type {
  TukangFilterDTO,
  TukangListContext,
} from "../../../domain/dtos/TukangDTO.js";

function formatStatusPernikahan(
  sudahMenikah: boolean | null | undefined,
  jumlahAnak: number | null | undefined,
): string {
  if (sudahMenikah === null || sudahMenikah === undefined) return "-";
  if (!sudahMenikah) return "Belum menikah";
  return `Menikah (${jumlahAnak ?? 0} anak)`;
}

export class ExportTukangsUseCase {
  constructor(private readonly tukangRepo: TukangRepository) {}

  async execute(
    filters: TukangFilterDTO | undefined,
    ctx: TukangListContext,
  ): Promise<Buffer> {
    // null = tanpa take 500 agar export mencakup semua data yang cocok filter
    const items = await this.tukangRepo.findAll(filters, ctx, null);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Data Tukang");

    worksheet.columns = [
      { header: "No", key: "no", width: 5 },
      { header: "NIK", key: "nik", width: 20 },
      { header: "Nama", key: "nama", width: 28 },
      { header: "Status Pernikahan", key: "statusPernikahan", width: 22 },
      { header: "Mandor", key: "mandor", width: 20 },
      { header: "Ada KTP", key: "adaKtp", width: 12 },
    ];

    items.forEach((item, index) => {
      const row = worksheet.addRow({
        no: index + 1,
        nik: item.nik,
        nama: item.nama,
        statusPernikahan: formatStatusPernikahan(
          item.sudahMenikah,
          item.jumlahAnak,
        ),
        mandor: item.mandorUsername ?? "-",
        adaKtp: item.fileKtp ? "Ya" : "Tidak",
      });
      // Paksa NIK sebagai teks agar Excel tidak ubah ke scientific notation
      row.getCell("nik").numFmt = "@";
    });

    const headerRow = worksheet.getRow(1);
    if (headerRow) {
      headerRow.font = { bold: true };
      headerRow.alignment = { vertical: "middle", horizontal: "center" };
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
