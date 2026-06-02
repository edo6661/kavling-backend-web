import type { PrismaClient } from "@prisma/client";
import type { SuketPphRepository } from "../../../domain/repositories/suketPphRepo.js";
import type { CloudinaryService } from "../../../infrastructure/external/CloudinaryService.js";
import type { SuketPphResponseDTO } from "../../../domain/dtos/SuketPphDTO.js";
import { NotFoundError } from "../../../domain/errors/NotFoundError.js";
import { AppError } from "../../../domain/errors/AppError.js";
import { StatusCodes } from "http-status-codes";

export class UploadSuketPphUseCase {
  constructor(
    private readonly repo: SuketPphRepository,
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
  }): Promise<SuketPphResponseDTO> {
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
      "bumantara/suket-pph",
      pdfPassword,
    );

    const existing = await this.repo.findByPenjualanId(
      penjualanId,
      sertifikatUrutan,
    );
    if (existing) {
      await this.cloudinaryService.deleteImageByUrl(existing.fileSuket);
      return await this.repo.replaceFile(existing.id, fileUrl, uploadedBy);
    }

    return await this.repo.create({
      customerId,
      penjualanId,
      sertifikatUrutan,
      fileSuket: fileUrl,
      uploadedBy: uploadedBy ?? null,
    });
  }
}

export class GetSuketPphByPenjualanUseCase {
  constructor(private readonly repo: SuketPphRepository) {}

  async execute(penjualanId: number): Promise<SuketPphResponseDTO | null> {
    return await this.repo.findByPenjualanId(penjualanId, 1);
  }
}

export class GetAllSuketPphByPenjualanUseCase {
  constructor(private readonly repo: SuketPphRepository) {}

  async execute(penjualanId: number): Promise<SuketPphResponseDTO[]> {
    return await this.repo.findAllByPenjualanId(penjualanId);
  }
}
