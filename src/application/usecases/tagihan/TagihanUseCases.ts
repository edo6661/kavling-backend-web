import type { ITagihanRepository } from "../../../domain/repositories/ITagihanRepo.js";
import type {
  CreateTagihanDTO,
  UpdateTagihanDTO,
  TagihanFilterDTO,
  TagihanResponseDTO,
} from "../../../domain/dtos/TagihanDTO.js";
import type { OffsetPaginatedData } from "../../../types/response.js";
import { NotFoundError } from "../../../domain/errors/NotFoundError.js";
import type { CloudinaryService } from "../../../infrastructure/external/CloudinaryService.js";

type ITtdData = Record<
  string,
  {
    nama: string;
    tanggal: string;
    url: string;
  }
>;

export class CreateTagihanUseCase {
  constructor(private readonly repo: ITagihanRepository) {}
  async execute(data: CreateTagihanDTO): Promise<TagihanResponseDTO> {
    const count = await this.repo.count();
    const noTagihan = `INV-${String(count + 1).padStart(3, "0")}`;
    return await this.repo.create(data, noTagihan);
  }
}

export class UpdateTagihanUseCase {
  constructor(private readonly repo: ITagihanRepository) {}
  async execute(
    id: number,
    data: UpdateTagihanDTO,
  ): Promise<TagihanResponseDTO> {
    return await this.repo.update(id, data);
  }
}

export class GetTagihanByIdUseCase {
  constructor(private readonly repo: ITagihanRepository) {}
  async execute(id: number): Promise<TagihanResponseDTO> {
    const result = await this.repo.findById(id);
    if (!result) throw new NotFoundError("Tagihan tidak ditemukan");
    return result;
  }
}

export class GetTagihansPaginatedUseCase {
  constructor(private readonly repo: ITagihanRepository) {}
  async execute(
    page: number, // <-- Ubah cursor jadi page
    limit: number,
    filters?: TagihanFilterDTO,
  ): Promise<OffsetPaginatedData<TagihanResponseDTO>> {
    // <-- Ubah return type
    return await this.repo.findWithOffsetPagination(page, limit, filters);
  }
}
export class DeleteTagihanUseCase {
  constructor(
    private readonly repo: ITagihanRepository,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async execute(id: number): Promise<void> {
    const tagihan = await this.repo.findById(id);
    if (!tagihan) throw new NotFoundError("Tagihan tidak ditemukan");

    const filesToDelete = [tagihan.fileBukti, tagihan.fileBuktiRefund].filter(
      Boolean,
    ) as string[];

    if (tagihan.ttdData) {
      const ttdObj = tagihan.ttdData as unknown as ITtdData;
      Object.values(ttdObj).forEach((ttd) => {
        if (ttd?.url) filesToDelete.push(ttd.url);
      });
    }

    for (const url of filesToDelete) {
      await this.cloudinaryService
        .deleteImageByUrl(url)
        .catch((err) =>
          console.error(`Gagal hapus file saat delete tagihan: ${url}`, err),
        );
    }

    await this.repo.delete(id);
  }
}
