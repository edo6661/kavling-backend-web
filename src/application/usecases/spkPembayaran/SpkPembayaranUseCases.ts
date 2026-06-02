import type { ISpkRepository } from "../../../domain/repositories/ISpkRepo.js";
import type { SpkPembayaranRepository } from "../../../domain/repositories/spkPembayaranRepo.js";
import type {
  AddBuktiSpkPembayaranDTO,
  BayarSpkPembayaranDTO,
  CreateSpkPembayaranDTO,
  RemoveBuktiSpkPembayaranDTO,
  SetBsiCmsDilaporkanDTO,
  SpkPembayaranFilterDTO,
  UpdateSpkKasbonDTO,
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
              tanggalPo: data.tanggalPo,
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
    fileBuffers: Buffer[],
    tanggalPembayaran?: Date,
  ): Promise<SpkPembayaranEntity> {
    if (!fileBuffers.length || fileBuffers.some((buffer) => !buffer?.length)) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Bukti pembayaran wajib diunggah");
    }

    const existing = await this.pembayaranRepo.findById(id);
    if (!existing) throw new NotFoundError("Pengajuan pembayaran SPK tidak ditemukan");

    if (existing.status === "SUDAH_DIBAYAR") {
      throw new AppError(StatusCodes.BAD_REQUEST, "Pembayaran ini sudah diproses.");
    }

    const spk = await this.spkRepo.findById(existing.spkId);
    if (!spk) throw new NotFoundError("SPK tidak ditemukan");

    const buktiPembayaranList = await Promise.all(
      fileBuffers.map((fileBuffer) =>
        this.cloudinary.uploadFile(fileBuffer, "bumantara/spk-pembayaran"),
      ),
    );

    const payDto: BayarSpkPembayaranDTO = {
      id,
      dibayarOlehId,
      buktiPembayaran: buktiPembayaranList[0]!,
      buktiPembayaranList,
    };
    if (tanggalPembayaran) payDto.tanggalPembayaran = tanggalPembayaran;

    return await this.pembayaranRepo.markAsPaidWithSync(payDto);
  }
}

export class UpdateSpkKasbonUseCase {
  constructor(private readonly pembayaranRepo: SpkPembayaranRepository) {}

  async execute(data: UpdateSpkKasbonDTO, userRole: string): Promise<SpkPembayaranEntity> {
    if (userRole === Role.MANDOR) {
      throw new AppError(
        StatusCodes.FORBIDDEN,
        "Mandor tidak dapat mengubah data kasbon.",
      );
    }

    if (!data.keterangan.trim() || data.nominal <= 0) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "Keterangan dan nominal kasbon wajib diisi.",
      );
    }

    try {
      return await this.pembayaranRepo.updateKasbon(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg === "SPK_PEMBAYARAN_NOT_FOUND") {
        throw new NotFoundError("Kasbon tidak ditemukan.");
      }
      if (msg === "NOT_KASBON") {
        throw new AppError(StatusCodes.BAD_REQUEST, "Hanya data kasbon yang dapat diubah.");
      }
      if (msg === "ALREADY_PAID") {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          "Kasbon yang sudah dibayar tidak dapat diubah.",
        );
      }
      if (msg === "HAS_BUKTI") {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          "Kasbon yang sudah memiliki bukti pembayaran tidak dapat diubah.",
        );
      }
      throw err;
    }
  }
}

export class AddBuktiSpkPembayaranUseCase {
  constructor(
    private readonly pembayaranRepo: SpkPembayaranRepository,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async execute(id: number, fileBuffers: Buffer[]): Promise<SpkPembayaranEntity> {
    if (!fileBuffers.length || fileBuffers.some((buffer) => !buffer?.length)) {
      throw new AppError(StatusCodes.BAD_REQUEST, "File bukti pembayaran wajib diunggah");
    }

    const existing = await this.pembayaranRepo.findById(id);
    if (!existing) throw new NotFoundError("Pengajuan pembayaran SPK tidak ditemukan");
    if (existing.status !== "SUDAH_DIBAYAR") {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "Bukti tambahan hanya bisa ditambahkan setelah pembayaran diproses.",
      );
    }

    const uploadedUrls = await Promise.all(
      fileBuffers.map((fileBuffer) =>
        this.cloudinary.uploadFile(fileBuffer, "bumantara/spk-pembayaran"),
      ),
    );

    const addDto: AddBuktiSpkPembayaranDTO = {
      id,
      buktiPembayaranList: uploadedUrls,
    };

    return await this.pembayaranRepo.addBuktiPembayaran(addDto);
  }
}

export class RemoveBuktiSpkPembayaranUseCase {
  constructor(
    private readonly pembayaranRepo: SpkPembayaranRepository,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async execute(id: number, buktiUrl: string): Promise<SpkPembayaranEntity> {
    const sanitizedUrl = buktiUrl.trim();
    if (!sanitizedUrl) {
      throw new AppError(StatusCodes.BAD_REQUEST, "URL bukti pembayaran wajib diisi.");
    }

    const existing = await this.pembayaranRepo.findById(id);
    if (!existing) throw new NotFoundError("Pengajuan pembayaran SPK tidak ditemukan");
    if (existing.status !== "SUDAH_DIBAYAR") {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "Bukti hanya bisa dihapus setelah pembayaran diproses.",
      );
    }

    try {
      const removeDto: RemoveBuktiSpkPembayaranDTO = {
        id,
        buktiUrl: sanitizedUrl,
      };
      const result = await this.pembayaranRepo.removeBuktiPembayaran(removeDto);
      await this.cloudinary.deleteImageByUrl(sanitizedUrl);
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg === "BUKTI_NOT_FOUND") {
        throw new NotFoundError("Bukti pembayaran tidak ditemukan.");
      }
      if (msg === "MIN_ONE_BUKTI_REQUIRED") {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          "Minimal harus tersisa 1 bukti pembayaran.",
        );
      }
      throw err;
    }
  }
}

export class SetBsiCmsDilaporkanUseCase {
  constructor(private readonly pembayaranRepo: SpkPembayaranRepository) {}

  async execute(data: SetBsiCmsDilaporkanDTO): Promise<SpkPembayaranEntity[]> {
    if (data.ids.length === 0) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Pilih minimal satu pembayaran.");
    }

    const uniqueIds = [...new Set(data.ids)];
    const results = await this.pembayaranRepo.setBsiCmsDilaporkan({
      ids: uniqueIds,
      dilaporkan: data.dilaporkan,
    });

    if (results.length !== uniqueIds.length) {
      throw new NotFoundError("Sebagian pembayaran SPK tidak ditemukan.");
    }

    return results;
  }
}
