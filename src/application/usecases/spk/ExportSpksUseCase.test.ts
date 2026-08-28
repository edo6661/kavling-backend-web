import ExcelJS from "exceljs";
import { beforeEach, describe, expect, it } from "vitest";
import { mock, type MockProxy } from "vitest-mock-extended";
import type { SpkEntity } from "../../../domain/entities/Spk.js";
import type { SpkPembayaranEntity } from "../../../domain/entities/SpkPembayaran.js";
import type { ISpkRepository } from "../../../domain/repositories/ISpkRepo.js";
import { ExportSpksUseCase } from "./ExportSpksUseCase.js";

const buildPayment = (): SpkPembayaranEntity => ({
  id: 100,
  spkId: 1,
  jenis: "KASBON",
  nominal: 2_500_000,
  keterangan: "Material pasir",
  tanggalPo: new Date("2026-02-01"),
  tanggalDari: null,
  tanggalSampai: null,
  mengurangiTermin: "TERMIN_55",
  kasbonBaris: [
    {
      id: 101,
      spkPembayaranId: 100,
      namaSupplier: "Supplier Material",
      keterangan: "Pasir",
      tanggalPo: new Date("2026-02-01"),
      nominal: 2_500_000,
      fotoBon: "https://example.test/bon.jpg",
    },
  ],
  status: "SUDAH_DIBAYAR",
  buktiPembayaran: "https://example.test/bukti.jpg",
  buktiPembayaranList: ["https://example.test/bukti.jpg"],
  dokumenInvoice: "https://example.test/invoice.pdf",
  dokumenMaterial: null,
  dokumenBeritaAcara: null,
  dokumenProgressSpk: null,
  tanggalPembayaran: new Date("2026-02-03"),
  bsiCmsDilaporkan: true,
  bsiCmsDilaporkanAt: new Date("2026-02-03"),
  diajukanOlehId: 3,
  disetujuiOlehId: 6,
  tanggalDisetujui: new Date("2026-02-02"),
  dibayarOlehId: 7,
  diajukanOleh: { id: 3, username: "mandor1" },
  disetujuiOleh: { id: 6, username: "pengawas" },
  dibayarOleh: { id: 7, username: "finance" },
  createdAt: new Date("2026-02-01"),
  updatedAt: new Date("2026-02-03"),
  isMandorSendiri: false,
  mandorRekeningId: null,
  mandorRekening: null,
});

const buildSpk = (
  overrides: Partial<SpkEntity> = {},
): SpkEntity => ({
  id: 1,
  noSpk: "001/2026",
  jenis: "RUMAH",
  terminScheme: "RUMAH_DEFAULT",
  tanggalSpk: new Date("2026-01-15"),
  judulPekerjaan: "Pekerjaan rumah",
  nilaiKontrak: 100_000_000,
  bankRekeningPtId: null,
  zonaId: null,
  zona: null,
  nilaiSudahDibayarkan: 25_000_000,
  sisaNilaiKontrak: 75_000_000,
  progressOverride: 55,
  progress: 55,
  progressIsOverride: true,
  notesPekerjaan: "Catatan",
  jatuhTempo: new Date("2026-12-31"),
  fileSpk: "https://example.test/spk.pdf",
  fileRab: "https://example.test/rab.pdf",
  mandorId: 3,
  mandor: { id: 3, username: "mandor1" },
  statusApproval: "APPROVED",
  diajukanOlehId: 5,
  disetujuiOlehId: 6,
  tanggalDisetujui: new Date("2026-01-16"),
  catatanPenolakan: null,
  diajukanOleh: { id: 5, username: "admin" },
  disetujuiOleh: { id: 6, username: "pengawas" },
  kavlingItems: [
    {
      id: 10,
      kavlingId: 20,
      blok: "A",
      nomorUnit: "01",
      luasTanah: 72,
      luasBangunan: 36,
      customerNama: "Customer Satu",
    },
  ],
  pekerjaanInfraItems: [],
  pembayaranList: [],
  createdAt: new Date("2026-01-15"),
  updatedAt: new Date("2026-01-16"),
  ...overrides,
});

describe("ExportSpksUseCase", () => {
  let repo: MockProxy<ISpkRepository>;
  let useCase: ExportSpksUseCase;

  beforeEach(() => {
    repo = mock<ISpkRepository>();
    useCase = new ExportSpksUseCase(repo);
  });

  it("menghasilkan workbook multi-sheet untuk SPK approved Rumah dan Infrastruktur", async () => {
    repo.findAll.mockResolvedValue([
      buildSpk({ pembayaranList: [buildPayment()] }),
      buildSpk({
        id: 2,
        noSpk: "002/2026",
        jenis: "INFRASTRUKTUR",
        statusApproval: "APPROVED",
        kavlingItems: [],
        zona: {
          id: 1,
          nama: "Zona Utama",
          hgb: "HGB",
          luas: "1000",
          deskripsi: "Zona proyek",
        },
        pekerjaanInfraItems: [
          {
            id: 30,
            pekerjaanInfraId: 40,
            nama: "Jalan lingkungan",
            kategori: "JALAN",
            urutan: 1,
          },
        ],
      }),
      buildSpk({
        id: 3,
        noSpk: "003/2026",
        statusApproval: "PENDING",
      }),
    ]);

    const buffer = await useCase.execute();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    expect(repo.findAll).toHaveBeenCalledWith({
      statusApproval: "APPROVED",
    });
    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual([
      "Ringkasan SPK",
      "Detail Kavling",
      "Detail Pembayaran",
      "Detail Kasbon",
      "Detail Upah",
      "Detail Infrastruktur",
      "Keterangan",
    ]);
    expect(workbook.getWorksheet("Ringkasan SPK")?.getRow(2).getCell(2).value).toBe(
      "Rumah",
    );
    expect(workbook.getWorksheet("Ringkasan SPK")?.getRow(3).getCell(2).value).toBe(
      "Infrastruktur",
    );
    expect(workbook.getWorksheet("Ringkasan SPK")?.getRow(4).getCell(3).value).toBe(
      "TOTAL",
    );
    expect(workbook.getWorksheet("Detail Kavling")?.rowCount).toBe(2);
    expect(workbook.getWorksheet("Detail Infrastruktur")?.rowCount).toBe(2);
    expect(workbook.getWorksheet("Detail Pembayaran")?.rowCount).toBe(2);
    expect(workbook.getWorksheet("Detail Kasbon")?.rowCount).toBe(2);
    expect(
      workbook.getWorksheet("Detail Pembayaran")?.getRow(2).getCell(20)
        .hyperlink,
    ).toBe("https://example.test/bukti.jpg");
  });

  it("tidak mengekspos kolom NIK atau rekening mandor", async () => {
    repo.findAll.mockResolvedValue([buildSpk()]);

    const buffer = await useCase.execute();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    for (const worksheet of workbook.worksheets) {
      const headers = worksheet
        .getRow(1)
        .values
        .map((value) => String(value ?? "").toLowerCase());
      expect(headers.some((header) => header.includes("nik"))).toBe(false);
      expect(headers.some((header) => header.includes("rekening"))).toBe(false);
    }
  });
});
