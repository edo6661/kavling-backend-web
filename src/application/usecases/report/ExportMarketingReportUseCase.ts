import ExcelJS from "exceljs";
import type { GetMarketingReportUseCase } from "./GetMarketingReportUseCase.js";
import type { MarketingReportFilterDTO } from "../../../domain/dtos/MarketingReportDTO.js";

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

const formatCurrencyColumns = (
  worksheet: ExcelJS.Worksheet,
  columns: number[],
) => {
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    for (const col of columns) {
      const cell = row.getCell(col);
      if (typeof cell.value === "number") {
        cell.numFmt = '"Rp"#,##0';
      }
    }
  });
};

export class ExportMarketingReportUseCase {
  constructor(
    private readonly getMarketingReportUseCase: GetMarketingReportUseCase,
  ) {}

  async execute(filters: MarketingReportFilterDTO): Promise<Buffer> {
    const report = await this.getMarketingReportUseCase.execute(filters);
    const workbook = new ExcelJS.Workbook();

    const summarySheet = workbook.addWorksheet("Ringkasan");
    summarySheet.columns = [
      { header: "Metrik", key: "metrik", width: 32 },
      { header: "Nilai", key: "nilai", width: 24 },
    ];
    styleHeaderRow(summarySheet);
    const s = report.summary;
    summarySheet.addRows([
      { metrik: "Total Kavling", nilai: s.totalKavling },
      { metrik: "Kavling Terjual", nilai: s.kavlingTerjual },
      { metrik: "Jumlah Penjualan (filter)", nilai: s.jumlahPenjualan },
      { metrik: "Penjualan Bulan Ini", nilai: s.penjualanPeriode },
      { metrik: "Agent Aktif", nilai: s.totalAgentAktif },
      { metrik: "Total Fee Booking", nilai: s.totalFeeBooking },
      { metrik: "Total Fee Closing", nilai: s.totalFeeClosing },
      { metrik: "Total Fee Marketing", nilai: s.totalFeeMarketing },
      { metrik: "Fee Sudah Dibayar (Booking)", nilai: s.feeBookingSudahDibayar },
      { metrik: "Fee Sudah Dibayar (Closing)", nilai: s.feeClosingSudahDibayar },
      { metrik: "Fee Sudah Dibayar (Marketing)", nilai: s.feeMarketingSudahDibayar },
      { metrik: "Fee Belum Dibayar", nilai: s.feeBelumDibayar },
    ]);
    formatCurrencyColumns(summarySheet, [2]);

    const agentSheet = workbook.addWorksheet("Per Agent");
    agentSheet.columns = [
      { header: "Agent", key: "nama", width: 24 },
      { header: "Perusahaan", key: "perusahaan", width: 22 },
      { header: "Booked", key: "booked", width: 10 },
      { header: "Proses", key: "proses", width: 10 },
      { header: "Lunas", key: "lunas", width: 10 },
      { header: "Closing", key: "closing", width: 10 },
      { header: "Konversi %", key: "konversi", width: 12 },
      { header: "Fee Booking", key: "feeBooking", width: 16 },
      { header: "Fee Closing", key: "feeClosing", width: 16 },
      { header: "Fee Marketing", key: "feeMarketing", width: 16 },
      { header: "Fee Sudah Bayar", key: "feeSudah", width: 18 },
      { header: "Fee Belum Bayar", key: "feeBelum", width: 18 },
    ];
    styleHeaderRow(agentSheet);
    report.byAgent.forEach((a) => {
      agentSheet.addRow({
        nama: a.nama,
        perusahaan: a.perusahaanNama ?? "—",
        booked: a.booked,
        proses: a.proses,
        lunas: a.lunas,
        closing: a.totalClosing,
        konversi: a.konversiRate,
        feeBooking: a.totalFeeBooking,
        feeClosing: a.totalFeeClosing,
        feeMarketing: a.totalFeeMarketing,
        feeSudah: a.feeSudahDibayar,
        feeBelum: a.feeBelumDibayar,
      });
    });
    formatCurrencyColumns(agentSheet, [8, 9, 10, 11, 12]);

    const perusahaanSheet = workbook.addWorksheet("Per Perusahaan");
    perusahaanSheet.columns = [
      { header: "Perusahaan", key: "nama", width: 28 },
      { header: "Jumlah Agent", key: "jumlahAgent", width: 14 },
      { header: "Total Closing", key: "closing", width: 14 },
      { header: "Total Fee", key: "totalFee", width: 18 },
      { header: "Fee Sudah Bayar", key: "feeSudah", width: 18 },
    ];
    styleHeaderRow(perusahaanSheet);
    report.byPerusahaan.forEach((p) => {
      perusahaanSheet.addRow({
        nama: p.nama,
        jumlahAgent: p.jumlahAgent,
        closing: p.totalClosing,
        totalFee: p.totalFee,
        feeSudah: p.feeSudahDibayar,
      });
    });
    formatCurrencyColumns(perusahaanSheet, [4, 5]);

    const feeSheet = workbook.addWorksheet("Detail Fee");
    feeSheet.columns = [
      { header: "No Transaksi", key: "noTransaksi", width: 18 },
      { header: "Tanggal", key: "tanggal", width: 12 },
      { header: "Status", key: "status", width: 12 },
      { header: "Customer", key: "customer", width: 22 },
      { header: "Kavling", key: "kavling", width: 18 },
      { header: "Agent", key: "agent", width: 20 },
      { header: "Fee Booking", key: "booking", width: 16 },
      { header: "Booking Bayar", key: "bookingBayar", width: 14 },
      { header: "Fee Closing", key: "closing", width: 16 },
      { header: "Closing Bayar", key: "closingBayar", width: 14 },
      { header: "Fee Marketing", key: "marketing", width: 16 },
      { header: "Marketing Bayar", key: "marketingBayar", width: 16 },
      { header: "Total Fee", key: "total", width: 16 },
    ];
    styleHeaderRow(feeSheet);
    report.feeItems.forEach((f) => {
      feeSheet.addRow({
        noTransaksi: f.noTransaksi,
        tanggal: f.tanggal,
        status: f.penjualanStatus,
        customer: f.customerNama,
        kavling: f.kavlingLabel,
        agent: f.agentNama,
        booking: f.bookingNominal,
        bookingBayar: f.bookingSudahDibayar ? "Sudah" : "Belum",
        closing: f.closingNominal,
        closingBayar: f.closingSudahDibayar ? "Sudah" : "Belum",
        marketing: f.marketingNominal,
        marketingBayar: f.marketingSudahDibayar ? "Sudah" : "Belum",
        total: f.totalFee,
      });
    });
    formatCurrencyColumns(feeSheet, [7, 9, 11, 13]);

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }
}
