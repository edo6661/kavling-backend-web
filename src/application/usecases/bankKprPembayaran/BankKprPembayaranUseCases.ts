import type { BankKprPembayaranRepository } from "../../../domain/repositories/bankKprPembayaranRepo.js";
import type {
  BayarBankKprPembayaranDTO,
  BankKprPembayaranFilterDTO,
  SetBankKprBsiCmsDilaporkanDTO,
} from "../../../domain/dtos/BankKprPembayaranDTO.js";
import type { BankKprPembayaranEntity } from "../../../domain/entities/BankKprPembayaran.js";
import type { OffsetPaginatedData } from "../../../types/response.js";
import { NotFoundError } from "../../../domain/errors/NotFoundError.js";
import { AppError } from "../../../domain/errors/AppError.js";
import { StatusCodes } from "http-status-codes";
import type { CloudinaryService } from "../../../infrastructure/external/CloudinaryService.js";

export class GetBankKprPembayaranPaginatedUseCase {
  constructor(private readonly pembayaranRepo: BankKprPembayaranRepository) {}

  async execute(
    page: number,
    limit: number,
    filters?: BankKprPembayaranFilterDTO,
  ): Promise<OffsetPaginatedData<BankKprPembayaranEntity>> {
    return await this.pembayaranRepo.findPaginated(page, limit, filters);
  }
}

export class BayarBankKprPembayaranUseCase {
  constructor(
    private readonly pembayaranRepo: BankKprPembayaranRepository,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async execute(
    id: number,
    dibayarOlehId: number,
    fileBuffer: Buffer,
    tanggalPembayaran?: Date,
  ): Promise<BankKprPembayaranEntity> {
    if (!fileBuffer?.length) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Bukti pembayaran wajib diunggah");
    }

    const existing = await this.pembayaranRepo.findById(id);
    if (!existing) {
      throw new NotFoundError("Pembayaran bank KPR tidak ditemukan");
    }

    if (existing.status === "SUDAH_DIBAYAR") {
      throw new AppError(StatusCodes.BAD_REQUEST, "Pembayaran ini sudah diproses.");
    }

    const buktiPembayaran = await this.cloudinary.uploadFile(
      fileBuffer,
      "bumantara/bank-kpr-pembayaran",
    );

    const payDto: BayarBankKprPembayaranDTO = {
      id,
      dibayarOlehId,
      buktiPembayaran,
    };
    if (tanggalPembayaran) payDto.tanggalPembayaran = tanggalPembayaran;

    return await this.pembayaranRepo.markAsPaid(payDto);
  }
}

export class SetBankKprBsiCmsDilaporkanUseCase {
  constructor(private readonly pembayaranRepo: BankKprPembayaranRepository) {}

  async execute(
    data: SetBankKprBsiCmsDilaporkanDTO,
  ): Promise<BankKprPembayaranEntity[]> {
    if (data.ids.length === 0) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Pilih minimal satu pembayaran.");
    }

    const uniqueIds = [...new Set(data.ids)];
    const results = await this.pembayaranRepo.setBsiCmsDilaporkan({
      ids: uniqueIds,
      dilaporkan: data.dilaporkan,
    });

    if (results.length !== uniqueIds.length) {
      throw new NotFoundError("Sebagian pembayaran bank KPR tidak ditemukan.");
    }

    return results;
  }
}

/** Sementara: backfill pembayaran dari penjualan KPR yang sudah punya biaya. */
export class SyncAllBankKprPembayaranUseCase {
  constructor(private readonly pembayaranRepo: BankKprPembayaranRepository) {}

  async execute(): Promise<void> {
    await this.pembayaranRepo.syncAllEligible();
  }
}
