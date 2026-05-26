import type { ISpkRepository } from "../../../domain/repositories/ISpkRepo.js";
import type { SpkPembayaranRepository } from "../../../domain/repositories/spkPembayaranRepo.js";
import type {
  BayarSpkPembayaranDTO,
  CreateSpkPembayaranDTO,
  SpkPembayaranFilterDTO,
} from "../../../domain/dtos/SpkPembayaranDTO.js";
import type { SpkPembayaranEntity } from "../../../domain/entities/SpkPembayaran.js";
import type { OffsetPaginatedData } from "../../../types/response.js";
import { NotFoundError } from "../../../domain/errors/NotFoundError.js";
import { AppError } from "../../../domain/errors/AppError.js";
import { StatusCodes } from "http-status-codes";
import {
  canRequestKasbon,
  canRequestSpkPembayaran,
} from "../../../domain/spk/spkPembayaranCalc.js";
import type { CloudinaryService } from "../../../infrastructure/external/CloudinaryService.js";
import { Role } from "@prisma/client";

export class CreateSpkPembayaranRequestUseCase {
  constructor(
    private readonly spkRepo: ISpkRepository,
    private readonly pembayaranRepo: SpkPembayaranRepository,
  ) {}

  async execute(
    data: CreateSpkPembayaranDTO,
    userId: number,
    userRole: string,
  ): Promise<SpkPembayaranEntity> {
    const spk = await this.spkRepo.findById(data.spkId);
    if (!spk) throw new NotFoundError("SPK tidak ditemukan");

    if (userRole === Role.MANDOR && spk.mandorId !== userId) {
      throw new AppError(
        StatusCodes.FORBIDDEN,
        "Mandor hanya dapat mengajukan pembayaran untuk SPK yang ditugaskan kepadanya.",
      );
    }

    const existing = await this.pembayaranRepo.findBySpkId(data.spkId);
    const statusRows = existing.map((p) => ({
      jenis: p.jenis,
      status: p.status,
      nominal: p.nominal,
      mengurangiTermin: p.mengurangiTermin,
    }));

    if (data.jenis === "KASBON") {
      const kasbonCheck = canRequestKasbon(statusRows);
      if (!kasbonCheck.allowed) {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          kasbonCheck.reason ?? "Tidak dapat mengajukan kasbon.",
        );
      }
      if (!data.keterangan.trim() || data.nominal <= 0) {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          "Keterangan dan nominal kasbon wajib diisi.",
        );
      }
    } else {
      const check = canRequestSpkPembayaran(
        data.jenis,
        { nilaiKontrak: spk.nilaiKontrak, progress: spk.progress },
        statusRows,
      );

      if (!check.allowed) {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          check.reason ?? "Tidak dapat mengajukan pembayaran.",
        );
      }
    }

    try {
      return await this.pembayaranRepo.createRequestWithSync(
        data.jenis === "KASBON"
          ? {
              spkId: data.spkId,
              jenis: "KASBON",
              keterangan: data.keterangan,
              nominal: data.nominal,
              diajukanOlehId: userId,
            }
          : {
              spkId: data.spkId,
              jenis: data.jenis,
              diajukanOlehId: userId,
            },
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg === "PEMBAYARAN_JENIS_EXISTS") {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          "Pengajuan termin ini sudah ada.",
        );
      }
      if (msg === "KASBON_NOT_ALLOWED") {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          "Kasbon tidak dapat diajukan pada tahap pembayaran ini.",
        );
      }
      throw err;
    }
  }
}

export class GetSpkPembayaranBySpkUseCase {
  constructor(private readonly pembayaranRepo: SpkPembayaranRepository) {}

  async execute(spkId: number): Promise<SpkPembayaranEntity[]> {
    return await this.pembayaranRepo.findBySpkId(spkId);
  }
}

export class GetSpkPembayaranPaginatedUseCase {
  constructor(private readonly pembayaranRepo: SpkPembayaranRepository) {}

  async execute(
    page: number,
    limit: number,
    filters?: SpkPembayaranFilterDTO,
  ): Promise<OffsetPaginatedData<SpkPembayaranEntity>> {
    return await this.pembayaranRepo.findPaginated(page, limit, filters);
  }
}

export class BayarSpkPembayaranUseCase {
  constructor(
    private readonly spkRepo: ISpkRepository,
    private readonly pembayaranRepo: SpkPembayaranRepository,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async execute(
    id: number,
    dibayarOlehId: number,
    fileBuffer: Buffer,
    tanggalPembayaran?: Date,
  ): Promise<SpkPembayaranEntity> {
    if (!fileBuffer?.length) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Bukti pembayaran wajib diunggah");
    }

    const existing = await this.pembayaranRepo.findById(id);
    if (!existing) throw new NotFoundError("Pengajuan pembayaran SPK tidak ditemukan");

    if (existing.status === "SUDAH_DIBAYAR") {
      throw new AppError(StatusCodes.BAD_REQUEST, "Pembayaran ini sudah diproses.");
    }

    const spk = await this.spkRepo.findById(existing.spkId);
    if (!spk) throw new NotFoundError("SPK tidak ditemukan");

    const buktiPembayaran = await this.cloudinary.uploadFile(
      fileBuffer,
      "bumantara/spk-pembayaran",
    );

    const payDto: BayarSpkPembayaranDTO = {
      id,
      dibayarOlehId,
      buktiPembayaran,
    };
    if (tanggalPembayaran) payDto.tanggalPembayaran = tanggalPembayaran;

    return await this.pembayaranRepo.markAsPaidWithSync(payDto);
  }
}
