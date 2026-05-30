import type { NotarisPembayaranRepository } from "../../../domain/repositories/notarisPembayaranRepo.js";
import type {
  BayarNotarisPembayaranDTO,
  NotarisPembayaranFilterDTO,
  SetNotarisBsiCmsDilaporkanDTO,
} from "../../../domain/dtos/NotarisPembayaranDTO.js";
import type { NotarisPembayaranEntity } from "../../../domain/entities/NotarisPembayaran.js";
import type { OffsetPaginatedData } from "../../../types/response.js";
import { NotFoundError } from "../../../domain/errors/NotFoundError.js";
import { AppError } from "../../../domain/errors/AppError.js";
import { StatusCodes } from "http-status-codes";
import type { CloudinaryService } from "../../../infrastructure/external/CloudinaryService.js";

export class GetNotarisPembayaranPaginatedUseCase {
  constructor(private readonly pembayaranRepo: NotarisPembayaranRepository) {}

  async execute(
    page: number,
    limit: number,
    filters?: NotarisPembayaranFilterDTO,
  ): Promise<OffsetPaginatedData<NotarisPembayaranEntity>> {
    return await this.pembayaranRepo.findPaginated(page, limit, filters);
  }
}

export class BayarNotarisPembayaranUseCase {
  constructor(
    private readonly pembayaranRepo: NotarisPembayaranRepository,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async execute(
    id: number,
    dibayarOlehId: number,
    fileBuffer: Buffer,
    tanggalPembayaran?: Date,
  ): Promise<NotarisPembayaranEntity> {
    if (!fileBuffer?.length) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Bukti pembayaran wajib diunggah");
    }

    const existing = await this.pembayaranRepo.findById(id);
    if (!existing) {
      throw new NotFoundError("Pembayaran notaris tidak ditemukan");
    }

    if (existing.status === "SUDAH_DIBAYAR") {
      throw new AppError(StatusCodes.BAD_REQUEST, "Pembayaran ini sudah diproses.");
    }

    const buktiPembayaran = await this.cloudinary.uploadFile(
      fileBuffer,
      "bumantara/notaris-pembayaran",
    );

    const payDto: BayarNotarisPembayaranDTO = {
      id,
      dibayarOlehId,
      buktiPembayaran,
    };
    if (tanggalPembayaran) payDto.tanggalPembayaran = tanggalPembayaran;

    return await this.pembayaranRepo.markAsPaid(payDto);
  }
}

export class SetNotarisBsiCmsDilaporkanUseCase {
  constructor(private readonly pembayaranRepo: NotarisPembayaranRepository) {}

  async execute(
    data: SetNotarisBsiCmsDilaporkanDTO,
  ): Promise<NotarisPembayaranEntity[]> {
    if (data.ids.length === 0) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Pilih minimal satu pembayaran.");
    }

    const uniqueIds = [...new Set(data.ids)];
    const results = await this.pembayaranRepo.setBsiCmsDilaporkan({
      ids: uniqueIds,
      dilaporkan: data.dilaporkan,
    });

    if (results.length !== uniqueIds.length) {
      throw new NotFoundError("Sebagian pembayaran notaris tidak ditemukan.");
    }

    return results;
  }
}
