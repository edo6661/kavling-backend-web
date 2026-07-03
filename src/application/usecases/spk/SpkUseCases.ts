import type { ISpkRepository } from "../../../domain/repositories/ISpkRepo.js";
import type {
  CreateSpkDTO,
  SpkFilterDTO,
  UpdateSpkDTO,
} from "../../../domain/dtos/SpkDTO.js";
import type { SpkEntity } from "../../../domain/entities/Spk.js";
import type { OffsetPaginatedData } from "../../../types/response.js";
import { NotFoundError } from "../../../domain/errors/NotFoundError.js";
import type { CloudinaryService } from "../../../infrastructure/external/CloudinaryService.js";
import { AppError } from "../../../domain/errors/AppError.js";
import { StatusCodes } from "http-status-codes";
import { Role } from "@prisma/client";
import type { NotificationService } from "../../../infrastructure/notifications/NotificationService.js";
import {
  buildSpkApprovalSelesaiNotification,
  buildSpkMenungguApprovalNotification,
} from "../../notifications/spkNotificationHelpers.js";

export class CreateSpkUseCase {
  constructor(
    private readonly repo: ISpkRepository,
    private readonly cloudinary: CloudinaryService,
    private readonly notificationService?: NotificationService,
  ) {}

  async execute(
    data: CreateSpkDTO,
    fileSpkBuffer?: Buffer,
    fileRabBuffer?: Buffer,
    userId?: number,
  ): Promise<SpkEntity> {
    let fileSpk = data.fileSpk ?? null;
    if (fileSpkBuffer) {
      fileSpk = await this.cloudinary.uploadFile(
        fileSpkBuffer,
        "bumantara/spk",
      );
    }

    let fileRab = data.fileRab ?? null;
    if (fileRabBuffer) {
      fileRab = await this.cloudinary.uploadFile(
        fileRabBuffer,
        "bumantara/spk/rab",
      );
    }

    const created = await this.repo.create({
      ...data,
      fileSpk,
      fileRab,
      diajukanOlehId: userId ?? data.diajukanOlehId,
    });

    if (this.notificationService) {
      try {
        await this.notificationService.notifyRoles(
          [Role.ADMIN, Role.SUPERADMIN],
          buildSpkMenungguApprovalNotification(created),
        );
      } catch (error) {
        console.error("Gagal mengirim notifikasi SPK menunggu approval:", error);
      }
    }

    return created;
  }
}

export class UpdateSpkUseCase {
  constructor(
    private readonly repo: ISpkRepository,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async execute(
    id: number,
    data: UpdateSpkDTO,
    fileSpkBuffer?: Buffer,
    fileRabBuffer?: Buffer,
  ): Promise<SpkEntity> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError("SPK tidak ditemukan");

    let fileSpk = data.fileSpk;
    if (fileSpkBuffer) {
      fileSpk = await this.cloudinary.uploadFile(
        fileSpkBuffer,
        "bumantara/spk",
      );
    }

    let fileRab = data.fileRab;
    if (fileRabBuffer) {
      fileRab = await this.cloudinary.uploadFile(
        fileRabBuffer,
        "bumantara/spk/rab",
      );
    }

    return await this.repo.update(id, {
      ...data,
      ...(fileSpk !== undefined ? { fileSpk } : {}),
      ...(fileRab !== undefined ? { fileRab } : {}),
    });
  }
}

export class GetSpkByIdUseCase {
  constructor(private readonly repo: ISpkRepository) {}

  async execute(id: number): Promise<SpkEntity> {
    const result = await this.repo.findById(id);
    if (!result) throw new NotFoundError("SPK tidak ditemukan");
    return result;
  }
}

export class GetSpkPaginatedUseCase {
  constructor(private readonly repo: ISpkRepository) {}

  async execute(
    page: number,
    limit: number,
    filters?: SpkFilterDTO,
  ): Promise<OffsetPaginatedData<SpkEntity>> {
    return await this.repo.findWithOffsetPagination(page, limit, filters);
  }
}

export class DeleteSpkUseCase {
  constructor(private readonly repo: ISpkRepository) {}

  async execute(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}

export class UploadSpkDocumentUseCase {
  constructor(
    private readonly repo: ISpkRepository,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async execute(id: number, fileBuffer: Buffer): Promise<SpkEntity> {
    if (!fileBuffer?.length) {
      throw new AppError(StatusCodes.BAD_REQUEST, "File SPK wajib diunggah");
    }

    const fileSpk = await this.cloudinary.uploadFile(
      fileBuffer,
      "bumantara/spk",
    );

    return await this.repo.update(id, { fileSpk });
  }
}

export class ApproveSpkUseCase {
  constructor(
    private readonly repo: ISpkRepository,
    private readonly notificationService?: NotificationService,
  ) {}

  async execute(id: number, userId: number, userRole: string): Promise<SpkEntity> {
    if (userRole !== Role.SUPERADMIN && userRole !== Role.ADMIN) {
      throw new AppError(
        StatusCodes.FORBIDDEN,
        "Hanya admin yang dapat menyetujui SPK.",
      );
    }

    const approved = await this.repo.approve(id, userId);

    if (this.notificationService) {
      try {
        const notifyIds = [
          approved.mandorId,
          approved.diajukanOlehId ?? undefined,
        ].filter((v): v is number => typeof v === "number" && v > 0);
        await this.notificationService.notifyUsers(
          notifyIds,
          buildSpkApprovalSelesaiNotification(approved, true),
        );
      } catch (error) {
        console.error("Gagal mengirim notifikasi persetujuan SPK:", error);
      }
    }

    return approved;
  }
}

export class RejectSpkUseCase {
  constructor(
    private readonly repo: ISpkRepository,
    private readonly notificationService?: NotificationService,
  ) {}

  async execute(
    id: number,
    userId: number,
    userRole: string,
    catatanPenolakan?: string,
  ): Promise<SpkEntity> {
    if (userRole !== Role.SUPERADMIN && userRole !== Role.ADMIN) {
      throw new AppError(
        StatusCodes.FORBIDDEN,
        "Hanya admin yang dapat menolak SPK.",
      );
    }

    const rejected = await this.repo.reject(id, userId, catatanPenolakan);

    if (this.notificationService) {
      try {
        const notifyIds = [
          rejected.mandorId,
          rejected.diajukanOlehId ?? undefined,
        ].filter((v): v is number => typeof v === "number" && v > 0);
        await this.notificationService.notifyUsers(
          notifyIds,
          buildSpkApprovalSelesaiNotification(rejected, false),
        );
      } catch (error) {
        console.error("Gagal mengirim notifikasi penolakan SPK:", error);
      }
    }

    return rejected;
  }
}
