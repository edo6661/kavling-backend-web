import ExcelJS from "exceljs";
import type { PrismaClient } from "@prisma/client";

export class ExportCustomersUseCase {
  constructor(private readonly db: PrismaClient) {}

  async execute(): Promise<Buffer> {
    const customers = await this.db.customer.findMany({
      orderBy: { nama: "asc" },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Data Customer");

    worksheet.columns = [
      { header: "No", key: "no", width: 5 },
      { header: "NIK KTP", key: "nikKtp", width: 20 },
      { header: "Nama Lengkap", key: "nama", width: 25 },
      { header: "No HP", key: "noHp", width: 15 },
      { header: "Email", key: "email", width: 25 },
      { header: "Pekerjaan", key: "pekerjaan", width: 20 },
      { header: "Perusahaan", key: "perusahaan", width: 25 },
      { header: "Alamat KTP", key: "alamatKtp", width: 40 },
      { header: "Status Akun Portal", key: "statusAkun", width: 20 },
    ];

    customers.forEach((c, index) => {
      worksheet.addRow({
        no: index + 1,
        nikKtp: c.nikKtp,
        nama: c.nama,
        noHp: c.noHp,
        email: c.email ?? "-",
        pekerjaan: c.pekerjaan ?? "-",
        perusahaan: c.perusahaan ?? "-",
        alamatKtp: c.alamatKtp,
        statusAkun: c.userId ? "Sudah Punya Akun" : "Belum Punya Akun",
      });
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
