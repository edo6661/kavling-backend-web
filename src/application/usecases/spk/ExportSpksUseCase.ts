import ExcelJS from "exceljs";
import type { SpkEntity } from "../../../domain/entities/Spk.js";
import type { SpkPembayaranEntity } from "../../../domain/entities/SpkPembayaran.js";
import type { SpkFilterDTO } from "../../../domain/dtos/SpkDTO.js";
import type { ISpkRepository } from "../../../domain/repositories/ISpkRepo.js";
import {
  buildSpkKasbonTargetLabel,
  buildSpkPembayaranJenisLabel,
} from "../../../domain/spk/spkTerminScheme.js";

const HEADER_FILL = "FF1E3A5F";
const HEADER_FONT = "FFFFFFFF";
const RUMAH_FILL = "FFE8F1FB";
const INFRA_FILL = "FFFFF4E5";
const BORDER_COLOR = "FFD9E2EC";
const CURRENCY_FORMAT = '"Rp"#,##0';
const DATE_FORMAT = "dd/mm/yyyy";

const APPROVAL_LABEL: Record<string, string> = {
  PENDING: "Menunggu Approve",
  APPROVED: "Disetujui",
  REJECTED: "Ditolak",
};

const PAYMENT_STATUS_LABEL: Record<string, string> = {
  MENUNGGU_PERSETUJUAN: "Menunggu Pengawas",
  MENUNGGU_APPROVAL_ADMIN: "Menunggu Admin",
  MENUNGGU_PEMBAYARAN: "Menunggu Finance",
  SUDAH_DIBAYAR: "Sudah Dibayar",
  DRAFT: "Draft",
};

const SPK_TYPE_LABEL: Record<string, string> = {
  RUMAH: "Rumah",
  INFRASTRUKTUR: "Infrastruktur",
};

interface ColumnDefinition {
  header: string;
  key: string;
  width: number;
}

const linkValue = (url: string | null | undefined) =>
  url ? { text: "Buka dokumen", hyperlink: url } : null;

const firstLink = (urls: string[] | null | undefined) =>
  linkValue(urls?.find((url) => url.trim()) ?? null);

const remainingLinks = (urls: string[] | null | undefined) =>
  (urls ?? []).filter((url) => url.trim()).slice(1).join("\n");

const formatStatus = (status: string | undefined) =>
  status ? APPROVAL_LABEL[status] ?? status : "Disetujui";

const formatPaymentStatus = (status: string) =>
  PAYMENT_STATUS_LABEL[status] ?? status;

const formatSpkType = (jenis: string) => SPK_TYPE_LABEL[jenis] ?? jenis;

const formatPaymentType = (payment: SpkPembayaranEntity, item: SpkEntity) => {
  const labels = buildSpkPembayaranJenisLabel(item.terminScheme);
  return labels[payment.jenis] ?? payment.jenis;
};

const formatTerminTarget = (
  payment: SpkPembayaranEntity,
  item: SpkEntity,
) => {
  if (!payment.mengurangiTermin) return "-";
  const labels = buildSpkKasbonTargetLabel(item.terminScheme);
  return labels[payment.mengurangiTermin] ?? payment.mengurangiTermin;
};

const styleWorksheet = (
  worksheet: ExcelJS.Worksheet,
  columns: ColumnDefinition[],
) => {
  worksheet.columns = columns;
  worksheet.views = [{ state: "frozen", ySplit: 1 }];
  worksheet.getRow(1).height = 24;
  worksheet.getRow(1).eachCell({ includeEmpty: true }, (cell) => {
    cell.font = { bold: true, color: { argb: HEADER_FONT } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: HEADER_FILL },
    };
    cell.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };
  });
};

const styleDataRow = (row: ExcelJS.Row, jenis: string) => {
  const fill = jenis === "INFRASTRUKTUR" ? INFRA_FILL : RUMAH_FILL;
  row.eachCell({ includeEmpty: true }, (cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: fill },
    };
    cell.border = {
      top: { style: "thin", color: { argb: BORDER_COLOR } },
      left: { style: "thin", color: { argb: BORDER_COLOR } },
      bottom: { style: "thin", color: { argb: BORDER_COLOR } },
      right: { style: "thin", color: { argb: BORDER_COLOR } },
    };
    cell.alignment = { vertical: "top", wrapText: true };
  });
};

const styleMoneyColumns = (row: ExcelJS.Row, keys: string[]) => {
  keys.forEach((key) => {
    const cell = row.getCell(key);
    cell.numFmt = CURRENCY_FORMAT;
    cell.alignment = { vertical: "top", horizontal: "right" };
  });
};

const styleDateColumns = (row: ExcelJS.Row, keys: string[]) => {
  keys.forEach((key) => {
    const cell = row.getCell(key);
    cell.numFmt = DATE_FORMAT;
    cell.alignment = { vertical: "top", horizontal: "center" };
  });
};

const addHyperlinkStyle = (row: ExcelJS.Row, keys: string[]) => {
  keys.forEach((key) => {
    const cell = row.getCell(key);
    if (cell.hyperlink) {
      cell.font = { color: { argb: "FF0563C1" }, underline: true };
    }
  });
};

const finishWorksheet = (worksheet: ExcelJS.Worksheet) => {
  if (worksheet.rowCount > 1) {
    worksheet.autoFilter = {
      from: "A1",
      to: {
        row: worksheet.rowCount,
        column: worksheet.columnCount,
      },
    };
  }
};

const addSpkSummarySheet = (
  workbook: ExcelJS.Workbook,
  items: SpkEntity[],
) => {
  const columns: ColumnDefinition[] = [
    { header: "No", key: "no", width: 6 },
    { header: "Jenis", key: "jenis", width: 16 },
    { header: "No. SPK", key: "noSpk", width: 18 },
    { header: "Tanggal SPK", key: "tanggalSpk", width: 14 },
    { header: "Judul Pekerjaan", key: "judulPekerjaan", width: 34 },
    { header: "Mandor", key: "mandor", width: 22 },
    { header: "Status Approval", key: "statusApproval", width: 20 },
    { header: "Zona", key: "zona", width: 22 },
    { header: "KSO", key: "kso", width: 24 },
    { header: "Progress (%)", key: "progress", width: 13 },
    { header: "Nilai Kontrak", key: "nilaiKontrak", width: 18 },
    { header: "Sudah Dibayar", key: "sudahDibayar", width: 18 },
    { header: "Sisa Nilai", key: "sisaNilai", width: 18 },
    { header: "Jatuh Tempo", key: "jatuhTempo", width: 14 },
    { header: "Skema Termin", key: "terminScheme", width: 20 },
    { header: "Catatan", key: "catatan", width: 32 },
    { header: "Dokumen SPK", key: "dokumenSpk", width: 18 },
    { header: "RAB", key: "rab", width: 18 },
  ];
  const worksheet = workbook.addWorksheet("Ringkasan SPK");
  styleWorksheet(worksheet, columns);

  let totalContract = 0;
  let totalPaid = 0;
  let totalRemaining = 0;

  items.forEach((item, index) => {
    const nilaiKontrak = Number(item.nilaiKontrak ?? 0);
    const sudahDibayar = Number(item.nilaiSudahDibayarkan ?? 0);
    const sisaNilai = Number(item.sisaNilaiKontrak ?? 0);
    totalContract += nilaiKontrak;
    totalPaid += sudahDibayar;
    totalRemaining += sisaNilai;

    const row = worksheet.addRow({
      no: index + 1,
      jenis: formatSpkType(item.jenis),
      noSpk: item.noSpk,
      tanggalSpk: item.tanggalSpk,
      judulPekerjaan: item.judulPekerjaan,
      mandor: item.mandor?.username ?? "-",
      statusApproval: formatStatus(item.statusApproval),
      zona: item.zona?.nama ?? "-",
      kso: item.bankRekeningPt
        ? `${item.bankRekeningPt.namaBank} · a/n ${item.bankRekeningPt.atasNama}`
        : "-",
      progress: Number(item.progress ?? 0),
      nilaiKontrak,
      sudahDibayar,
      sisaNilai,
      jatuhTempo: item.jatuhTempo,
      terminScheme: item.terminScheme,
      catatan: item.notesPekerjaan ?? "",
      dokumenSpk: linkValue(item.fileSpk),
      rab: linkValue(item.fileRab),
    });
    styleDataRow(row, item.jenis);
    styleMoneyColumns(row, ["nilaiKontrak", "sudahDibayar", "sisaNilai"]);
    styleDateColumns(row, ["tanggalSpk", "jatuhTempo"]);
    addHyperlinkStyle(row, ["dokumenSpk", "rab"]);
  });

  const totalRow = worksheet.addRow({
    no: "",
    jenis: "",
    noSpk: "TOTAL",
    nilaiKontrak: totalContract,
    sudahDibayar: totalPaid,
    sisaNilai: totalRemaining,
  });
  totalRow.font = { bold: true };
  totalRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFDCE6F1" },
  };
  styleMoneyColumns(totalRow, ["nilaiKontrak", "sudahDibayar", "sisaNilai"]);
  finishWorksheet(worksheet);
};

const addKavlingSheet = (workbook: ExcelJS.Workbook, items: SpkEntity[]) => {
  const columns: ColumnDefinition[] = [
    { header: "Jenis", key: "jenis", width: 16 },
    { header: "No. SPK", key: "noSpk", width: 18 },
    { header: "Mandor", key: "mandor", width: 22 },
    { header: "Blok", key: "blok", width: 12 },
    { header: "Unit", key: "unit", width: 12 },
    { header: "LT (m²)", key: "luasTanah", width: 12 },
    { header: "LB (m²)", key: "luasBangunan", width: 12 },
    { header: "Customer", key: "customer", width: 28 },
  ];
  const worksheet = workbook.addWorksheet("Detail Kavling");
  styleWorksheet(worksheet, columns);

  items.forEach((item) => {
    item.kavlingItems.forEach((kavling) => {
      const row = worksheet.addRow({
        jenis: formatSpkType(item.jenis),
        noSpk: item.noSpk,
        mandor: item.mandor?.username ?? "-",
        blok: kavling.blok,
        unit: kavling.nomorUnit,
        luasTanah: kavling.luasTanah,
        luasBangunan: kavling.luasBangunan,
        customer: kavling.customerNama || "-",
      });
      styleDataRow(row, item.jenis);
    });
  });
  finishWorksheet(worksheet);
};

const addPaymentSheet = (workbook: ExcelJS.Workbook, items: SpkEntity[]) => {
  const columns: ColumnDefinition[] = [
    { header: "Jenis SPK", key: "jenisSpk", width: 16 },
    { header: "No. SPK", key: "noSpk", width: 18 },
    { header: "Mandor", key: "mandor", width: 22 },
    { header: "ID Pembayaran", key: "id", width: 14 },
    { header: "Jenis Pembayaran", key: "jenis", width: 22 },
    { header: "Status", key: "status", width: 22 },
    { header: "Nominal", key: "nominal", width: 18 },
    { header: "Tanggal PO", key: "tanggalPo", width: 14 },
    { header: "Periode Dari", key: "tanggalDari", width: 14 },
    { header: "Periode Sampai", key: "tanggalSampai", width: 16 },
    { header: "Mengurangi Termin", key: "mengurangiTermin", width: 20 },
    { header: "Keterangan", key: "keterangan", width: 30 },
    { header: "Diajukan Oleh", key: "diajukanOleh", width: 20 },
    { header: "Tanggal Disetujui", key: "tanggalDisetujui", width: 18 },
    { header: "Disetujui Oleh", key: "disetujuiOleh", width: 20 },
    { header: "Tanggal Pembayaran", key: "tanggalPembayaran", width: 18 },
    { header: "Dibayar Oleh", key: "dibayarOleh", width: 20 },
    { header: "Mandor Sendiri", key: "isMandorSendiri", width: 16 },
    { header: "BSI/CMS Dilaporkan", key: "bsiCmsDilaporkan", width: 20 },
    { header: "Bukti Pembayaran", key: "buktiPembayaran", width: 20 },
    { header: "Bukti Lainnya", key: "buktiLainnya", width: 30 },
    { header: "Invoice", key: "invoice", width: 18 },
    { header: "Material", key: "material", width: 18 },
    { header: "Berita Acara", key: "beritaAcara", width: 18 },
    { header: "Progress SPK", key: "progressSpk", width: 18 },
  ];
  const worksheet = workbook.addWorksheet("Detail Pembayaran");
  styleWorksheet(worksheet, columns);

  const addRow = (item: SpkEntity, payment: SpkPembayaranEntity) => {
    const row = worksheet.addRow({
      jenisSpk: formatSpkType(item.jenis),
      noSpk: item.noSpk,
      mandor: item.mandor?.username ?? "-",
      id: payment.id,
      jenis: formatPaymentType(payment, item),
      status: formatPaymentStatus(payment.status),
      nominal: Number(payment.nominal ?? 0),
      tanggalPo: payment.tanggalPo,
      tanggalDari: payment.tanggalDari,
      tanggalSampai: payment.tanggalSampai,
      mengurangiTermin: formatTerminTarget(payment, item),
      keterangan: payment.keterangan ?? "",
      diajukanOleh: payment.diajukanOleh?.username ?? "-",
      tanggalDisetujui: payment.tanggalDisetujui,
      disetujuiOleh: payment.disetujuiOleh?.username ?? "-",
      tanggalPembayaran: payment.tanggalPembayaran,
      dibayarOleh: payment.dibayarOleh?.username ?? "-",
      isMandorSendiri: payment.isMandorSendiri ? "Ya" : "Tidak",
      bsiCmsDilaporkan: payment.bsiCmsDilaporkan ? "Ya" : "Tidak",
      buktiPembayaran: firstLink(payment.buktiPembayaranList),
      buktiLainnya: remainingLinks(payment.buktiPembayaranList),
      invoice: linkValue(payment.dokumenInvoice),
      material: linkValue(payment.dokumenMaterial),
      beritaAcara: linkValue(payment.dokumenBeritaAcara),
      progressSpk: linkValue(payment.dokumenProgressSpk),
    });
    styleDataRow(row, item.jenis);
    styleMoneyColumns(row, ["nominal"]);
    styleDateColumns(row, [
      "tanggalPo",
      "tanggalDari",
      "tanggalSampai",
      "tanggalDisetujui",
      "tanggalPembayaran",
    ]);
    addHyperlinkStyle(row, [
      "buktiPembayaran",
      "invoice",
      "material",
      "beritaAcara",
      "progressSpk",
    ]);
  };

  items.forEach((item) => {
    (item.pembayaranList ?? []).forEach((payment) => addRow(item, payment));
  });
  finishWorksheet(worksheet);
};

const addKasbonSheet = (workbook: ExcelJS.Workbook, items: SpkEntity[]) => {
  const columns: ColumnDefinition[] = [
    { header: "Jenis SPK", key: "jenisSpk", width: 16 },
    { header: "No. SPK", key: "noSpk", width: 18 },
    { header: "Mandor", key: "mandor", width: 22 },
    { header: "ID Pembayaran", key: "pembayaranId", width: 14 },
    { header: "Supplier", key: "supplier", width: 24 },
    { header: "Tanggal PO", key: "tanggalPo", width: 14 },
    { header: "Keterangan", key: "keterangan", width: 32 },
    { header: "Nominal", key: "nominal", width: 18 },
    { header: "Foto Bon", key: "fotoBon", width: 18 },
  ];
  const worksheet = workbook.addWorksheet("Detail Kasbon");
  styleWorksheet(worksheet, columns);

  items.forEach((item) => {
    (item.pembayaranList ?? [])
      .filter((payment) => payment.jenis === "KASBON")
      .forEach((payment) => {
        const rows = payment.kasbonBaris?.length
          ? payment.kasbonBaris
          : [
              {
                namaSupplier: "-",
                tanggalPo: payment.tanggalPo,
                keterangan: payment.keterangan ?? "",
                nominal: payment.nominal,
                fotoBon: null,
              },
            ];

        rows.forEach((kasbon) => {
          const row = worksheet.addRow({
            jenisSpk: formatSpkType(item.jenis),
            noSpk: item.noSpk,
            mandor: item.mandor?.username ?? "-",
            pembayaranId: payment.id,
            supplier: kasbon.namaSupplier || "-",
            tanggalPo: kasbon.tanggalPo,
            keterangan: kasbon.keterangan,
            nominal: Number(kasbon.nominal ?? 0),
            fotoBon: linkValue(kasbon.fotoBon),
          });
          styleDataRow(row, item.jenis);
          styleMoneyColumns(row, ["nominal"]);
          styleDateColumns(row, ["tanggalPo"]);
          addHyperlinkStyle(row, ["fotoBon"]);
        });
      });
  });
  finishWorksheet(worksheet);
};

const addUpahSheet = (workbook: ExcelJS.Workbook, items: SpkEntity[]) => {
  const columns: ColumnDefinition[] = [
    { header: "Jenis SPK", key: "jenisSpk", width: 16 },
    { header: "No. SPK", key: "noSpk", width: 18 },
    { header: "Mandor", key: "mandor", width: 22 },
    { header: "ID Pembayaran", key: "pembayaranId", width: 14 },
    { header: "Periode Dari", key: "tanggalDari", width: 14 },
    { header: "Periode Sampai", key: "tanggalSampai", width: 16 },
    { header: "Nama Tukang", key: "nama", width: 28 },
    { header: "Nominal Upah", key: "nominal", width: 18 },
  ];
  const worksheet = workbook.addWorksheet("Detail Upah");
  styleWorksheet(worksheet, columns);

  items.forEach((item) => {
    (item.pembayaranList ?? [])
      .filter((payment) => payment.jenis === "UPAH")
      .forEach((payment) => {
        const rows = payment.upahBaris?.length
          ? payment.upahBaris
          : [{ nama: "-", nominal: payment.nominal }];

        rows.forEach((upah) => {
          const row = worksheet.addRow({
            jenisSpk: formatSpkType(item.jenis),
            noSpk: item.noSpk,
            mandor: item.mandor?.username ?? "-",
            pembayaranId: payment.id,
            tanggalDari: payment.tanggalDari,
            tanggalSampai: payment.tanggalSampai,
            nama: upah.nama,
            nominal: Number(upah.nominal ?? 0),
          });
          styleDataRow(row, item.jenis);
          styleMoneyColumns(row, ["nominal"]);
          styleDateColumns(row, ["tanggalDari", "tanggalSampai"]);
        });
      });
  });
  finishWorksheet(worksheet);
};

const addInfrastructureSheet = (
  workbook: ExcelJS.Workbook,
  items: SpkEntity[],
) => {
  const columns: ColumnDefinition[] = [
    { header: "Jenis SPK", key: "jenisSpk", width: 18 },
    { header: "No. SPK", key: "noSpk", width: 18 },
    { header: "Mandor", key: "mandor", width: 22 },
    { header: "Zona", key: "zona", width: 24 },
    { header: "Nama Pekerjaan", key: "nama", width: 34 },
    { header: "Kategori", key: "kategori", width: 22 },
    { header: "Urutan", key: "urutan", width: 10 },
  ];
  const worksheet = workbook.addWorksheet("Detail Infrastruktur");
  styleWorksheet(worksheet, columns);

  items.forEach((item) => {
    item.pekerjaanInfraItems.forEach((pekerjaan) => {
      const row = worksheet.addRow({
        jenisSpk: formatSpkType(item.jenis),
        noSpk: item.noSpk,
        mandor: item.mandor?.username ?? "-",
        zona: item.zona?.nama ?? "-",
        nama: pekerjaan.nama,
        kategori: pekerjaan.kategori,
        urutan: pekerjaan.urutan,
      });
      styleDataRow(row, item.jenis);
    });
  });
  finishWorksheet(worksheet);
};

const addLegendSheet = (workbook: ExcelJS.Workbook) => {
  const worksheet = workbook.addWorksheet("Keterangan");
  worksheet.columns = [
    { header: "Jenis", key: "jenis", width: 20 },
    { header: "Keterangan", key: "keterangan", width: 42 },
  ];
  styleWorksheet(worksheet, [
    { header: "Jenis", key: "jenis", width: 20 },
    { header: "Keterangan", key: "keterangan", width: 42 },
  ]);

  const rumah = worksheet.addRow({
    jenis: "Rumah",
    keterangan: "SPK pekerjaan rumah dan kavling",
  });
  styleDataRow(rumah, "RUMAH");

  const infra = worksheet.addRow({
    jenis: "Infrastruktur",
    keterangan: "SPK pekerjaan infrastruktur dan zona",
  });
  styleDataRow(infra, "INFRASTRUKTUR");
};

export class ExportSpksUseCase {
  constructor(private readonly spkRepo: ISpkRepository) {}

  async execute(filters?: SpkFilterDTO): Promise<Buffer> {
    const approvedItems = await this.spkRepo.findAll({
      statusApproval: "APPROVED",
      ...(filters?.mandorId ? { mandorId: filters.mandorId } : {}),
      ...(filters?.orderBy ? { orderBy: filters.orderBy } : {}),
    });
    const items = approvedItems.filter(
      (item) => item.statusApproval === "APPROVED",
    );

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Kavling Backend";
    workbook.created = new Date();
    workbook.properties.date1904 = false;

    addSpkSummarySheet(workbook, items);
    addKavlingSheet(workbook, items);
    addPaymentSheet(workbook, items);
    addKasbonSheet(workbook, items);
    addUpahSheet(workbook, items);
    addInfrastructureSheet(workbook, items);
    addLegendSheet(workbook);

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
