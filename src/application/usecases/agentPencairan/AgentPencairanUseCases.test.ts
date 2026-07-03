import { describe, it, expect, beforeEach, vi } from "vitest";
import { mock, type MockProxy } from "vitest-mock-extended";
import type { PrismaClient } from "@prisma/client";
import {
  AjukanAgentPencairanUseCase,
  BatalAgentPencairanUseCase,
  BayarAgentPencairanUseCase,
} from "./AgentPencairanUseCases.js";
import type { IAgentPencairanRepository } from "../../../domain/repositories/IAgentPencairanRepo.js";
import type { CloudinaryService } from "../../../infrastructure/external/CloudinaryService.js";
import type { AgentPencairanEntity } from "../../../domain/entities/AgentPencairan.js";
import { AppError } from "../../../domain/errors/AppError.js";

const INVOICE_URL = "https://cloudinary.com/invoice.pdf";
const INVOICE_URL_2 = "https://cloudinary.com/invoice-2.pdf";
const BUKTI_URL = "https://cloudinary.com/bukti.pdf";

function buildFeeAgent(agentType: "PRIBADI" | "PERUSAHAAN") {
  return {
    id: 1,
    penjualanId: 10,
    agentId: 5,
    closingNominal: null,
    agent: {
      type: agentType,
      feeMarketingPct: 2,
      feeClosingNominal: 5_000_000,
      potonganPph: 2.5,
      isPkp: false,
      perusahaanAgent:
        agentType === "PERUSAHAAN"
          ? {
              feeMarketingPct: 2,
              feeClosingNominal: 5_000_000,
              potonganPph: 2.5,
              isPkp: false,
              namaBank: "BCA",
              noRekening: "123",
              atasNamaRekening: "PT Test",
            }
          : null,
    },
    penjualan: {
      status: "AKTIF",
      caraPembayaran: "CASH_KERAS",
      hargaJual: 500_000_000,
      kavling: { jumlahSertifikatTanah: 1 },
      tagihan: [
        { tujuan: "BOOKING_FEE", pembayaran: "CASH", status: "LUNAS" },
      ],
      progressPenjualan: {
        nilaiAjb: 0,
        filePpjb: "https://example.com/ppjb.pdf",
        fileAjb: null,
        fileSp3k: null,
        fileSuratPernyataanAkadKredit: null,
        sertifikatTambahan: [],
      },
    },
  };
}

function buildCreatedPencairan(
  overrides: Partial<AgentPencairanEntity> = {},
): AgentPencairanEntity {
  return {
    id: 99,
    feeAgentId: 1,
    penjualanId: 10,
    agentId: 5,
    tahap: "PPJB",
    closingNominal: 5_000_000,
    marketingNominal: 0,
    potonganPph: 125_000,
    totalNominal: 4_875_000,
    status: "MENUNGGU_PEMBAYARAN",
    fileInvoice: null,
    fileInvoiceList: [],
    buktiPembayaran: null,
    tanggalPembayaran: null,
    bsiCmsDilaporkan: false,
    bsiCmsDilaporkanAt: null,
    diajukanOlehId: 1,
    dibayarOlehId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("AjukanAgentPencairanUseCase — invoice agent perusahaan", () => {
  let repoMock: MockProxy<IAgentPencairanRepository>;
  let dbMock: { feeAgent: { findUnique: ReturnType<typeof vi.fn> } };
  let cloudinaryMock: MockProxy<CloudinaryService>;
  let useCase: AjukanAgentPencairanUseCase;

  beforeEach(() => {
    repoMock = mock<IAgentPencairanRepository>();
    dbMock = {
      feeAgent: {
        findUnique: vi.fn(),
      },
    };
    cloudinaryMock = mock<CloudinaryService>();
    useCase = new AjukanAgentPencairanUseCase(
      repoMock,
      dbMock as unknown as PrismaClient,
      cloudinaryMock,
    );
    vi.clearAllMocks();
    repoMock.findByFeeAgentId.mockResolvedValue([]);
    repoMock.create.mockImplementation(async (data) =>
      buildCreatedPencairan({
        closingNominal: data.closingNominal,
        marketingNominal: data.marketingNominal,
        fileInvoice: data.fileInvoice ?? data.fileInvoiceList?.[0] ?? null,
        fileInvoiceList: data.fileInvoiceList ?? [],
      }),
    );
  });

  it("agent pribadi: ajukan tanpa invoice berhasil", async () => {
    dbMock.feeAgent.findUnique.mockResolvedValue(buildFeeAgent("PRIBADI"));

    const result = await useCase.execute({
      feeAgentId: 1,
      includeClosing: true,
      includeMarketing: false,
      diajukanOlehId: 1,
    });

    expect(cloudinaryMock.uploadFile).not.toHaveBeenCalled();
    expect(repoMock.create).toHaveBeenCalledWith(
      expect.objectContaining({ fileInvoiceList: null }),
    );
    expect(result.fileInvoiceList).toEqual([]);
  });

  it("agent perusahaan: ajukan tanpa invoice ditolak", async () => {
    dbMock.feeAgent.findUnique.mockResolvedValue(buildFeeAgent("PERUSAHAAN"));

    await expect(
      useCase.execute({
        feeAgentId: 1,
        includeClosing: true,
        includeMarketing: false,
        diajukanOlehId: 1,
      }),
    ).rejects.toMatchObject({
      message: "Invoice wajib diunggah untuk agent perusahaan (PDF atau gambar).",
    });

    expect(repoMock.create).not.toHaveBeenCalled();
  });

  it("agent perusahaan: ajukan dengan beberapa invoice berhasil", async () => {
    dbMock.feeAgent.findUnique.mockResolvedValue(buildFeeAgent("PERUSAHAAN"));
    cloudinaryMock.uploadFile
      .mockResolvedValueOnce(INVOICE_URL)
      .mockResolvedValueOnce(INVOICE_URL_2);

    const result = await useCase.execute({
      feeAgentId: 1,
      includeClosing: true,
      includeMarketing: false,
      diajukanOlehId: 1,
      invoiceFileBuffers: [Buffer.from("pdf-1"), Buffer.from("pdf-2")],
    });

    expect(cloudinaryMock.uploadFile).toHaveBeenCalledTimes(2);
    expect(repoMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        fileInvoiceList: [INVOICE_URL, INVOICE_URL_2],
        fileInvoice: INVOICE_URL,
      }),
    );
    expect(result.fileInvoiceList).toEqual([INVOICE_URL, INVOICE_URL_2]);
  });

  it("agent perusahaan: merge ke pending tanpa invoice lama wajib upload", async () => {
    dbMock.feeAgent.findUnique.mockResolvedValue(buildFeeAgent("PERUSAHAAN"));
    repoMock.findByFeeAgentId.mockResolvedValue([
      buildCreatedPencairan({
        id: 50,
        tahap: "PPJB",
        status: "MENUNGGU_PEMBAYARAN",
        closingNominal: 2_500_000,
        marketingNominal: 0,
      }),
    ]);

    await expect(
      useCase.execute({
        feeAgentId: 1,
        includeClosing: false,
        includeMarketing: true,
        diajukanOlehId: 1,
      }),
    ).rejects.toBeInstanceOf(AppError);

    expect(repoMock.updatePendingAjukan).not.toHaveBeenCalled();
  });

  it("agent perusahaan: merge ke pending yang sudah punya invoice tidak wajib upload ulang", async () => {
    const feeAgent = buildFeeAgent("PERUSAHAAN");
    feeAgent.penjualan.progressPenjualan.nilaiAjb = 500_000_000;
    dbMock.feeAgent.findUnique.mockResolvedValue(feeAgent);
    repoMock.findByFeeAgentId.mockResolvedValue([
      buildCreatedPencairan({
        id: 50,
        tahap: "PPJB",
        status: "MENUNGGU_PEMBAYARAN",
        closingNominal: 2_500_000,
        marketingNominal: 0,
        potonganPph: 62_500,
        totalNominal: 2_437_500,
        fileInvoice: INVOICE_URL,
        fileInvoiceList: [INVOICE_URL],
      }),
    ]);
    repoMock.updatePendingAjukan.mockResolvedValue(
      buildCreatedPencairan({
        id: 50,
        fileInvoice: INVOICE_URL,
        fileInvoiceList: [INVOICE_URL],
        marketingNominal: 2_500_000,
      }),
    );

    await useCase.execute({
      feeAgentId: 1,
      includeClosing: false,
      includeMarketing: true,
      diajukanOlehId: 1,
    });

    expect(cloudinaryMock.uploadFile).not.toHaveBeenCalled();
    expect(repoMock.updatePendingAjukan).toHaveBeenCalled();
    expect(repoMock.create).not.toHaveBeenCalled();
  });
});

describe("BayarAgentPencairanUseCase — existing flow", () => {
  let repoMock: MockProxy<IAgentPencairanRepository>;
  let cloudinaryMock: MockProxy<CloudinaryService>;
  let useCase: BayarAgentPencairanUseCase;

  beforeEach(() => {
    repoMock = mock<IAgentPencairanRepository>();
    cloudinaryMock = mock<CloudinaryService>();
    useCase = new BayarAgentPencairanUseCase(repoMock, cloudinaryMock);
    vi.clearAllMocks();
  });

  it("masih menolak bayar tanpa bukti pembayaran", async () => {
    repoMock.findById.mockResolvedValue(buildCreatedPencairan());

    await expect(
      useCase.execute(99, 1, Buffer.alloc(0)),
    ).rejects.toMatchObject({
      message: "Bukti pembayaran wajib diunggah",
    });
  });

  it("masih memproses bayar dengan bukti pembayaran", async () => {
    const pending = buildCreatedPencairan();
    repoMock.findById.mockResolvedValue(pending);
    cloudinaryMock.uploadFile.mockResolvedValue(BUKTI_URL);
    repoMock.markAsPaid.mockResolvedValue({
      ...pending,
      status: "SUDAH_DIBAYAR",
      buktiPembayaran: BUKTI_URL,
    });

    const buffer = Buffer.from("bukti");
    const result = await useCase.execute(99, 2, buffer);

    expect(cloudinaryMock.uploadFile).toHaveBeenCalledWith(
      buffer,
      "bumantara/agent-pencairan",
    );
    expect(repoMock.markAsPaid).toHaveBeenCalledWith(
      expect.objectContaining({ buktiPembayaran: BUKTI_URL }),
    );
    expect(result.status).toBe("SUDAH_DIBAYAR");
  });
});

describe("BatalAgentPencairanUseCase", () => {
  let repoMock: MockProxy<IAgentPencairanRepository>;
  let useCase: BatalAgentPencairanUseCase;

  beforeEach(() => {
    repoMock = mock<IAgentPencairanRepository>();
    useCase = new BatalAgentPencairanUseCase(repoMock);
    vi.clearAllMocks();
  });

  it("membatalkan pengajuan yang masih menunggu pembayaran", async () => {
    repoMock.findById.mockResolvedValue(buildCreatedPencairan());
    repoMock.deletePending.mockResolvedValue(true);

    await expect(useCase.execute(99)).resolves.toBeUndefined();
    expect(repoMock.deletePending).toHaveBeenCalledWith(99);
  });

  it("menolak batal jika sudah dibayar", async () => {
    repoMock.findById.mockResolvedValue(
      buildCreatedPencairan({ status: "SUDAH_DIBAYAR" }),
    );

    await expect(useCase.execute(99)).rejects.toMatchObject({
      message: "Hanya pengajuan yang belum dibayar yang bisa dibatalkan.",
    });
    expect(repoMock.deletePending).not.toHaveBeenCalled();
  });

  it("menolak batal jika pengajuan tidak ditemukan", async () => {
    repoMock.findById.mockResolvedValue(null);

    await expect(useCase.execute(99)).rejects.toMatchObject({
      message: "Pengajuan pencairan agent tidak ditemukan",
    });
  });
});
