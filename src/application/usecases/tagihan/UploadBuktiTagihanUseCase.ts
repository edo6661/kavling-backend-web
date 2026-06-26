import type { ITagihanRepository } from "../../../domain/repositories/ITagihanRepo.js";
import type { CloudinaryService } from "../../../infrastructure/external/CloudinaryService.js";
import type { TagihanResponseDTO } from "../../../domain/dtos/TagihanDTO.js";
import { NotFoundError } from "../../../domain/errors/NotFoundError.js";
import { AppError } from "../../../domain/errors/AppError.js";
import { StatusCodes } from "http-status-codes";
import { collectTagihanFileBuktiUrls } from "../../../utils/tagihanBukti.js";
import type { NotificationService } from "../../../infrastructure/notifications/NotificationService.js";
import { Role } from "@prisma/client";
import { buildTagihanUploadBuktiNotification } from "../../notifications/uploadBuktiNotificationHelpers.js";

export class UploadBuktiTagihanUseCase {
  constructor(
    private readonly repo: ITagihanRepository,
    private readonly cloudinaryService: CloudinaryService,
    private readonly notificationService?: NotificationService,
  ) {}
  async execute(
    identifier: number | string,
    fileBuffers: Buffer | Buffer[],
    isCustomer = false,
  ): Promise<TagihanResponseDTO> {
    const buffers = Array.isArray(fileBuffers) ? fileBuffers : [fileBuffers];

    const existing =
      typeof identifier === "number"
        ? await this.repo.findById(identifier)
        : await this.repo.findByNoTagihan(identifier);

    if (!existing) {
      throw new NotFoundError("Tagihan tidak ditemukan");
    }

    if (!buffers.length || buffers.some((buffer) => !buffer?.length)) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "File dokumen tidak boleh kosong",
      );
    }

    if (
      isCustomer &&
      existing.status !== "BELUM_BAYAR" &&
      existing.status !== "MENUNGGU_KONFIRMASI"
    ) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "Bukti pembayaran hanya dapat diunggah untuk tagihan yang belum lunas.",
      );
    }

    const uploadedUrls = await Promise.all(
      buffers.map((fileBuffer) =>
        this.cloudinaryService.uploadImage(fileBuffer, "bumantara/tagihan"),
      ),
    );

    const currentList = collectTagihanFileBuktiUrls(
      existing.fileBukti,
      existing.fileBuktiList,
    );
    const mergedList = [...currentList, ...uploadedUrls];
    const primaryBukti = mergedList[0] ?? null;

    const updatePayload: {
      fileBukti: string | null;
      fileBuktiList: string[];
      status?: "MENUNGGU_KONFIRMASI";
    } = {
      fileBukti: primaryBukti,
      fileBuktiList: mergedList,
    };

    if (existing.status === "BELUM_BAYAR") {
      updatePayload.status = "MENUNGGU_KONFIRMASI";
    }

    const updatedTagihan = await this.repo.update(existing.id, updatePayload);

    if (
      updatePayload.status === "MENUNGGU_KONFIRMASI" &&
      this.notificationService
    ) {
      try {
        await this.notificationService.notifyRoles(
          [Role.ADMIN, Role.SUPERADMIN, Role.FINANCE],
          buildTagihanUploadBuktiNotification({
            namaCustomer: existing.namaCustomer,
            pembayaran: existing.pembayaran,
            noTagihan: existing.noTagihan,
            nominal: existing.nominal,
            blok: existing.blok,
            nomorUnit: existing.nomorUnit,
            perumahan: existing.perumahan,
            isCustomer,
          }),
        );
      } catch (error) {
        console.error("Gagal mengirim notifikasi upload bukti:", error);
      }
    }

    return updatedTagihan;
  }
}
