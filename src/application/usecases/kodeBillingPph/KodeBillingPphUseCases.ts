import type { PrismaClient } from "@prisma/client";
import type { KodeBillingPphRepository } from "../../../domain/repositories/kodeBillingPphRepo.js";
import type { CloudinaryService } from "../../../infrastructure/external/CloudinaryService.js";
import type {
  KodeBillingPphFilterDTO,
  KodeBillingPphResponseDTO,
} from "../../../domain/dtos/KodeBillingPphDTO.js";
import type { OffsetPaginatedData } from "../../../types/response.js";
import { NotFoundError } from "../../../domain/errors/NotFoundError.js";
import { AppError } from "../../../domain/errors/AppError.js";
import { StatusCodes } from "http-status-codes";
import {
  extractKodeBillingFromText,
  extractTextFromPdf,
  isPdfLikelyScanned,
} from "../../../infrastructure/utils/billingPphPdfUtils.js";
import { isPdfBuffer, unlockPdf } from "../../../infrastructure/utils/pdfUtils.js";
import type { GoogleVisionService } from "../../../infrastructure/external/GoogleVisionService.js";

export class UploadKodeBillingPphUseCase {
  constructor(
    private readonly repo: KodeBillingPphRepository,
    private readonly db: PrismaClient,
    private readonly cloudinaryService: CloudinaryService,
    private readonly googleVisionService: GoogleVisionService,
  ) {}

  async execute(params: {
    customerId: number;
    penjualanId: number;
    sertifikatUrutan?: number | undefined;
    fileBuffer: Buffer;
    pdfPassword?: string | undefined;
    uploadedBy?: number | undefined;
  }): Promise<KodeBillingPphResponseDTO> {
    const {
      customerId,
      penjualanId,
      sertifikatUrutan = 1,
      fileBuffer,
      pdfPassword,
      uploadedBy,
    } = params;

    if (!penjualanId) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "Penjualan wajib dipilih untuk upload Kode Billing PPh.",
      );
    }

    if (!fileBuffer?.length) {
      throw new AppError(StatusCodes.BAD_REQUEST, "File tidak boleh kosong");
    }
    if (!isPdfBuffer(fileBuffer)) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "Kode Billing PPh hanya dapat diunggah dalam format PDF.",
      );
    }

    const customer = await this.db.customer.findUnique({
      where: { id: customerId },
    });
    if (!customer) throw new NotFoundError("Customer tidak ditemukan");

    const penjualan = await this.db.penjualan.findFirst({
      where: { id: penjualanId, customerId },
      include: { kavling: { select: { jumlahSertifikatTanah: true } } },
    });
    if (!penjualan) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "Penjualan tidak ditemukan untuk customer ini.",
      );
    }
    if (
      sertifikatUrutan < 1 ||
      sertifikatUrutan > (penjualan.kavling.jumlahSertifikatTanah ?? 1)
    ) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        `Urutan sertifikat ${sertifikatUrutan} tidak valid untuk kavling ini.`,
      );
    }

    let text: string;
    try {
      text = await extractTextFromPdf(fileBuffer, pdfPassword);
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "Gagal membaca PDF. Pastikan file valid dan password benar jika PDF terkunci.",
      );
    }

    let kodeBilling = extractKodeBillingFromText(text);

    if (!kodeBilling) {
      const pdfForOcr = isPdfBuffer(fileBuffer)
        ? unlockPdf(fileBuffer, pdfPassword)
        : fileBuffer;
      const ocrKode =
        await this.googleVisionService.extractKodeBillingFromScannedPdf(
          pdfForOcr,
        );
      kodeBilling = ocrKode
        ? extractKodeBillingFromText(ocrKode) ?? ocrKode
        : null;
    }

    if (!kodeBilling) {
      const scannedHint = isPdfLikelyScanned(text)
        ? " Dokumen tampak hasil scan — pastikan gambar jelas dan tidak buram."
        : "";
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        `PDF tidak berisi kode billing PPh. Pastikan file adalah dokumen Kode Billing DJP yang valid.${scannedHint}`,
        true,
      );
    }

    const fileUrl = (
      await this.cloudinaryService.uploadImage(
        fileBuffer,
        "bumantara/kode-billing-pph",
        pdfPassword,
      )
    ).trim();

    if (!fileUrl.startsWith("http")) {
      throw new AppError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "File PDF berhasil diproses tetapi gagal disimpan ke cloud. Silakan coba unggah lagi.",
      );
    }

    const existingRecord = await this.repo.findByPenjualanId(
      penjualanId,
      sertifikatUrutan,
    );

    let record: KodeBillingPphResponseDTO;
    if (existingRecord) {
      await this.cloudinaryService.deleteImageByUrl(existingRecord.fileBilling);
      if (existingRecord.fileBuktiBayar) {
        await this.cloudinaryService.deleteImageByUrl(existingRecord.fileBuktiBayar);
      }
      record = await this.repo.replaceBilling(existingRecord.id, {
        kodeBilling,
        fileBilling: fileUrl,
        uploadedBy: uploadedBy ?? null,
      });
    } else {
      record = await this.repo.create({
        customerId,
        penjualanId,
        sertifikatUrutan,
        kodeBilling,
        fileBilling: fileUrl,
        uploadedBy: uploadedBy ?? null,
      });
    }

    return record;
  }
}

export class UploadBuktiBayarKodeBillingPphUseCase {
  constructor(
    private readonly repo: KodeBillingPphRepository,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async execute(id: number, fileBuffer: Buffer): Promise<KodeBillingPphResponseDTO> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError("Data kode billing PPh tidak ditemukan");

    if (!fileBuffer?.length) {
      throw new AppError(StatusCodes.BAD_REQUEST, "File bukti tidak boleh kosong");
    }

    if (existing.fileBuktiBayar) {
      await this.cloudinaryService.deleteImageByUrl(existing.fileBuktiBayar);
    }

    const fileUrl = await this.cloudinaryService.uploadImage(
      fileBuffer,
      "bumantara/kode-billing-pph/bukti",
    );

    return await this.repo.updateBuktiBayar(id, fileUrl);
  }
}

export class GetKodeBillingPphPaginatedUseCase {
  constructor(private readonly repo: KodeBillingPphRepository) {}

  async execute(
    page: number,
    limit: number,
    filters?: KodeBillingPphFilterDTO,
  ): Promise<OffsetPaginatedData<KodeBillingPphResponseDTO>> {
    return await this.repo.findWithOffsetPagination(page, limit, filters);
  }
}

export class GetKodeBillingPphByPenjualanUseCase {
  constructor(private readonly repo: KodeBillingPphRepository) {}

  async execute(penjualanId: number): Promise<KodeBillingPphResponseDTO | null> {
    return await this.repo.findByPenjualanId(penjualanId, 1);
  }
}

export class GetAllKodeBillingPphByPenjualanUseCase {
  constructor(private readonly repo: KodeBillingPphRepository) {}

  async execute(penjualanId: number): Promise<KodeBillingPphResponseDTO[]> {
    return await this.repo.findAllByPenjualanId(penjualanId);
  }
}
