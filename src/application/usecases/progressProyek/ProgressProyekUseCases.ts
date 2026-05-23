import type { ProgressProyekEntity } from "../../../domain/entities/ProgressProyek.js";
import type { UpdateProgressProyekDTO } from "../../../domain/dtos/ProgressProyekDTO.js";
import type { CloudinaryService } from "../../../infrastructure/external/CloudinaryService.js";
import { AppError } from "../../../domain/errors/AppError.js";
import { StatusCodes } from "http-status-codes";
import type { IProgressProyekRepository } from "../../../domain/repositories/IProgressProyekRepo.js";
import type { ProgressProyekListFilterDTO } from "../../../domain/dtos/ProgressProyekDTO.js";
import type { IUserRepository } from "../../../domain/repositories/IUserRepo.js";
import { Role } from "@prisma/client";
import {
  assertAssignedMandor,
  assertMandorCanMutate,
  isMandorRole,
  type ProgressRequestContext,
} from "./mandorAccess.js";

export class GetProgressProyekUseCase {
  constructor(private readonly repo: IProgressProyekRepository) {}

  async execute(
    penjualanId: number,
    ctx?: ProgressRequestContext,
  ): Promise<ProgressProyekEntity> {
    let progress = await this.repo.findByPenjualanId(penjualanId);

    if (isMandorRole(ctx?.role)) {
      if (!ctx?.userId) {
        throw new AppError(StatusCodes.UNAUTHORIZED, "User tidak valid");
      }
      assertAssignedMandor(progress, ctx.userId);
      return progress;
    }

    progress ??= await this.repo.create({ penjualanId, mandorId: null });
    return progress;
  }
}

export class UpdateProgressProyekUseCase {
  constructor(private readonly repo: IProgressProyekRepository) {}

  async execute(
    penjualanId: number,
    data: UpdateProgressProyekDTO,
    ctx?: ProgressRequestContext,
  ): Promise<ProgressProyekEntity> {
    const progress = await this.repo.findByPenjualanId(penjualanId);

    if (isMandorRole(ctx?.role)) {
      if (!ctx?.userId) {
        throw new AppError(StatusCodes.UNAUTHORIZED, "User tidak valid");
      }
      assertAssignedMandor(progress, ctx.userId);
    }

    return await this.repo.update(penjualanId, data);
  }
}

export class UploadTahapanPhotoUseCase {
  constructor(
    private readonly repo: IProgressProyekRepository,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async execute(
    penjualanId: number,
    namaTahapan: string,
    files: Buffer[],
    ctx?: ProgressRequestContext,
  ): Promise<ProgressProyekEntity> {
    if (!files || files.length === 0) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "File foto tidak boleh kosong",
      );
    }

    const progress = await this.repo.findByPenjualanId(penjualanId);
    assertMandorCanMutate(progress, ctx);

    if (!progress) {
      throw new AppError(
        StatusCodes.NOT_FOUND,
        "Progress proyek tidak ditemukan",
      );
    }

    const tahapan = progress.tahapan.find((t) => t.namaTahapan === namaTahapan);
    const existingPhotos = tahapan?.foto ?? [];

    const uploadedUrls = await Promise.all(
      files.map((fileBuffer) =>
        this.cloudinaryService.uploadImage(
          fileBuffer,
          `bumantara/progress_proyek/${penjualanId}/${namaTahapan.replace(/\s+/g, "_")}`,
        ),
      ),
    );

    const newPhotos = [...existingPhotos, ...uploadedUrls];

    return await this.repo.update(penjualanId, {
      tahapan: [
        {
          namaTahapan,
          persentase: tahapan?.persentase ?? 0,
          deskripsi: tahapan?.deskripsi ?? null,
          tanggal: tahapan?.tanggal ?? new Date(),
          foto: newPhotos,
        },
      ],
    });
  }
}

export class CreateTahapanLogUseCase {
  constructor(
    private readonly repo: IProgressProyekRepository,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async execute(
    penjualanId: number,
    namaTahapan: string,
    persentase: number,
    deskripsi: string,
    tanggal: string,
    files: Buffer[],
    reportedById?: number | null,
    ctx?: ProgressRequestContext,
  ) {
    const progress = await this.repo.findByPenjualanId(penjualanId);
    assertMandorCanMutate(progress, ctx);

    const photoUrls = await Promise.all(
      files.map((file) =>
        this.cloudinary.uploadImage(
          file,
          `bumantara/progress/${penjualanId}/${namaTahapan}`,
        ),
      ),
    );

    return await this.repo.addTahapanLog(penjualanId, {
      namaTahapan,
      persentase,
      deskripsi,
      tanggal: new Date(tanggal),
      foto: photoUrls,
      reportedById: reportedById ?? null,
    });
  }
}

export class ListMandorsUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute() {
    return await this.userRepo.findByRole(Role.MANDOR);
  }
}

export class GetProgressProyekListPaginatedUseCase {
  constructor(private readonly repo: IProgressProyekRepository) {}

  async execute(
    page: number,
    limit: number,
    filters?: ProgressProyekListFilterDTO,
  ) {
    return await this.repo.findProyekListPaginated(page, limit, filters);
  }
}
