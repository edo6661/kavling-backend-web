import type { ITagihanRepository } from "../../../domain/repositories/ITagihanRepo.js";
import type { CloudinaryService } from "../../../infrastructure/external/CloudinaryService.js";
import type { TagihanResponseDTO } from "../../../domain/dtos/TagihanDTO.js";
import { NotFoundError } from "../../../domain/errors/NotFoundError.js";
import { AppError } from "../../../domain/errors/AppError.js";
import { StatusCodes } from "http-status-codes";
import { collectTagihanFileBuktiUrls } from "../../../utils/tagihanBukti.js";

export class RemoveBuktiTagihanUseCase {
  constructor(
    private readonly repo: ITagihanRepository,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async execute(id: number, buktiUrl: string): Promise<TagihanResponseDTO> {
    const sanitizedUrl = buktiUrl.trim();
    if (!sanitizedUrl) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "URL bukti pembayaran wajib diisi.",
      );
    }

    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new NotFoundError("Tagihan tidak ditemukan");
    }

    const currentList = collectTagihanFileBuktiUrls(
      existing.fileBukti,
      existing.fileBuktiList,
    );

    if (!currentList.includes(sanitizedUrl)) {
      throw new NotFoundError("Bukti pembayaran tidak ditemukan");
    }

    const newList = currentList.filter((url) => url !== sanitizedUrl);
    const primaryBukti = newList[0] ?? null;

    await this.cloudinaryService
      .deleteImageByUrl(sanitizedUrl)
      .catch(console.error);

    const updateData: {
      fileBukti: string | null;
      fileBuktiList: string[] | null;
      status?: "BELUM_BAYAR";
    } = {
      fileBukti: primaryBukti,
      fileBuktiList: newList.length > 0 ? newList : null,
    };

    if (newList.length === 0 && existing.status === "MENUNGGU_KONFIRMASI") {
      updateData.status = "BELUM_BAYAR";
    }

    return await this.repo.update(id, updateData);
  }
}
