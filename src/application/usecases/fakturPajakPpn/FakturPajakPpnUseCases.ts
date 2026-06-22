import type { PrismaClient } from "@prisma/client";
import type { FakturPajakPpnRepository } from "../../../domain/repositories/fakturPajakPpnRepo.js";
import type { CloudinaryService } from "../../../infrastructure/external/CloudinaryService.js";
import type { FakturPajakPpnResponseDTO } from "../../../domain/dtos/FakturPajakPpnDTO.js";
import { NotFoundError } from "../../../domain/errors/NotFoundError.js";
import { AppError } from "../../../domain/errors/AppError.js";
import { StatusCodes } from "http-status-codes";

export class UploadFakturPajakPpnUseCase {
  constructor(
    private readonly repo: FakturPajakPpnRepository,
    private readonly db: PrismaClient,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async execute(params: {
    customerId: number;
    penjualanId: number;
    sertifikatUrutan?: number | undefined;
    fileBuffer: Buffer;
    pdfPassword?: string | undefined;
    uploadedBy?: number | undefined;
  }): Promise<FakturPajakPpnResponseDTO> {
    const {
      customerId,
      penjualanId,
      sertifikatUrutan = 1,
      fileBuffer,
      pdfPassword,
      uploadedBy,
    } = params;

    if (!fileBuffer?.length) {
      throw new AppError(StatusCodes.BAD_REQUEST, "File tidak boleh kosong");
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

    const fileUrl = await this.cloudinaryService.uploadImage(
      fileBuffer,
      "bumantara/faktur-pajak-ppn",
      pdfPassword,
    );

    const existing = await this.repo.findByPenjualanId(
      penjualanId,
      sertifikatUrutan,
    );
    if (existing) {
      await this.cloudinaryService.deleteImageByUrl(existing.fileFaktur);
      return await this.repo.replaceFile(existing.id, fileUrl, uploadedBy);
    }

    return await this.repo.create({
      customerId,
      penjualanId,
      sertifikatUrutan,
      fileFaktur: fileUrl,
      uploadedBy: uploadedBy ?? null,
    });
  }
}

export class GetFakturPajakPpnByPenjualanUseCase {
  constructor(private readonly repo: FakturPajakPpnRepository) {}

  async execute(penjualanId: number): Promise<FakturPajakPpnResponseDTO | null> {
    return await this.repo.findByPenjualanId(penjualanId, 1);
  }
}

export class GetAllFakturPajakPpnByPenjualanUseCase {
  constructor(private readonly repo: FakturPajakPpnRepository) {}

  async execute(penjualanId: number): Promise<FakturPajakPpnResponseDTO[]> {
    return await this.repo.findAllByPenjualanId(penjualanId);
  }
}

export class DeleteFakturPajakPpnUseCase {
  constructor(
    private readonly repo: FakturPajakPpnRepository,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async execute(
    penjualanId: number,
    sertifikatUrutan = 1,
  ): Promise<void> {
    const normalizedPenjualanId = Number(penjualanId);
    const normalizedUrutan = Number(sertifikatUrutan) || 1;

    if (!Number.isInteger(normalizedPenjualanId) || normalizedPenjualanId <= 0) {
      throw new AppError(StatusCodes.BAD_REQUEST, "ID penjualan tidak valid.");
    }
    if (!Number.isInteger(normalizedUrutan) || normalizedUrutan < 1) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Urutan sertifikat tidak valid.");
    }

    const existing = await this.repo.findByPenjualanId(
      normalizedPenjualanId,
      normalizedUrutan,
    );
    if (!existing) {
      throw new AppError(
        StatusCodes.NOT_FOUND,
        "Faktur pajak PPN tidak ditemukan atau sudah dihapus.",
      );
    }

    await this.cloudinaryService.deleteImageByUrl(existing.fileFaktur);
    await this.repo.deleteById(existing.id);
  }
}
