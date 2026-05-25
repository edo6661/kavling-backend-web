import type { Prisma, PrismaClient } from "@prisma/client";
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
  KODE_BILLING_PPH_DOC_NAME,
} from "../../../infrastructure/utils/billingPphPdfUtils.js";
import { isPdfBuffer } from "../../../infrastructure/utils/pdfUtils.js";

interface IDokumenLainnya {
  id: string;
  nama: string;
  fileUrl: string | string[];
}

export class UploadKodeBillingPphUseCase {
  constructor(
    private readonly repo: KodeBillingPphRepository,
    private readonly db: PrismaClient,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async execute(params: {
    customerId: number;
    penjualanId: number;
    fileBuffer: Buffer;
    pdfPassword?: string;
    uploadedBy?: number;
  }): Promise<KodeBillingPphResponseDTO> {
    const { customerId, penjualanId, fileBuffer, pdfPassword, uploadedBy } =
      params;

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

    const kodeBilling = extractKodeBillingFromText(text);
    if (!kodeBilling) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "PDF tidak berisi kode billing PPh. Pastikan file adalah dokumen Kode Billing DJP yang valid.",
        true,
      );
    }

    const fileUrl = await this.cloudinaryService.uploadImage(
      fileBuffer,
      "bumantara/kode-billing-pph",
      pdfPassword,
    );

    const existingRecord = await this.repo.findByPenjualanId(penjualanId);

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
        kodeBilling,
        fileBilling: fileUrl,
        uploadedBy: uploadedBy ?? null,
      });
    }

    const currentDocs: IDokumenLainnya[] = Array.isArray(customer.dokumenLainnya)
      ? (customer.dokumenLainnya as unknown as IDokumenLainnya[])
      : [];

    const docIndex = currentDocs.findIndex(
      (d) => d.nama.toLowerCase() === KODE_BILLING_PPH_DOC_NAME.toLowerCase(),
    );

    if (docIndex >= 0) {
      const doc = currentDocs[docIndex]!;
      const prevUrls = Array.isArray(doc.fileUrl)
        ? doc.fileUrl
        : doc.fileUrl
          ? [doc.fileUrl]
          : [];
      for (const oldUrl of prevUrls) {
        if (oldUrl !== fileUrl) {
          await this.cloudinaryService.deleteImageByUrl(oldUrl);
        }
      }
      currentDocs[docIndex] = { ...doc, fileUrl: [fileUrl] };
    } else {
      currentDocs.push({
        id: Date.now().toString(),
        nama: KODE_BILLING_PPH_DOC_NAME,
        fileUrl: [fileUrl],
      });
    }

    await this.db.customer.update({
      where: { id: customerId },
      data: { dokumenLainnya: currentDocs as unknown as Prisma.InputJsonValue },
    });

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
