import type { ISprPaymentRepository } from "../../../domain/repositories/ISprPaymentRepo.js";
import type { CloudinaryService } from "../../../infrastructure/external/CloudinaryService.js";
import type {
  CreateSprPaymentDTO,
  UpdateSprPaymentDTO,
  SprPaymentFilterDTO,
  SprPaymentResponseDTO,
} from "../../../domain/dtos/SprPaymentDTO.js";
import type { CursorPaginatedData } from "../../../types/response.js";
import { SprPaymentMapper } from "../../../infrastructure/mapper/SprPaymentMapper.js";
import { NotFoundError } from "../../../domain/errors/NotFoundError.js";
import { AppError } from "../../../domain/errors/AppError.js";
import { StatusCodes } from "http-status-codes";
import type { ISprRepository } from "../../../domain/repositories/ISprRepo.js";
import type { IMasterDataProgressRepository } from "../../../domain/repositories/IMasterDataProgressRepo.js";

export class CreateSprPaymentUseCase {
  constructor(private readonly repo: ISprPaymentRepository) {}
  async execute(data: CreateSprPaymentDTO): Promise<SprPaymentResponseDTO> {
    const result = await this.repo.create(data);
    return SprPaymentMapper.toDomain(result);
  }
}

export class UpdateSprPaymentUseCase {
  constructor(private readonly repo: ISprPaymentRepository) {}
  async execute(
    id: number,
    data: UpdateSprPaymentDTO,
  ): Promise<SprPaymentResponseDTO> {
    const result = await this.repo.update(id, data);
    return SprPaymentMapper.toDomain(result);
  }
}

export class GetSprPaymentByIdUseCase {
  constructor(private readonly repo: ISprPaymentRepository) {}
  async execute(id: number): Promise<SprPaymentResponseDTO> {
    const result = await this.repo.findById(id);
    if (!result) throw new NotFoundError("Data pembayaran tidak ditemukan");
    return SprPaymentMapper.toDomain(result);
  }
}

export class GetSprPaymentsPaginatedUseCase {
  constructor(private readonly repo: ISprPaymentRepository) {}
  async execute(
    limit: number,
    cursor?: number,
    filters?: SprPaymentFilterDTO,
  ): Promise<CursorPaginatedData<SprPaymentResponseDTO>> {
    const result = await this.repo.findWithCursorPagination(
      limit,
      cursor,
      filters,
    );
    return {
      items: result.items.map((item) => SprPaymentMapper.toDomain(item)),
      meta: result.meta,
    };
  }
}

export class DeleteSprPaymentUseCase {
  constructor(private readonly repo: ISprPaymentRepository) {}
  async execute(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}
export class UploadBuktiTransferUseCase {
  constructor(
    private readonly repo: ISprPaymentRepository,
    private readonly cloudinaryService: CloudinaryService,
    private readonly sprRepo: ISprRepository,
    private readonly masterDataProgressRepo: IMasterDataProgressRepository,
  ) {}

  async execute(
    id: number,
    fileBuffer: Buffer,
  ): Promise<SprPaymentResponseDTO> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new NotFoundError("Data tagihan tidak ditemukan");
    }

    if (!fileBuffer) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "File bukti transfer tidak boleh kosong",
      );
    }

    if (existing.buktiTransfer) {
      await this.cloudinaryService.deleteImageByUrl(existing.buktiTransfer);
    }

    const imageUrl = await this.cloudinaryService.uploadImage(
      fileBuffer,
      "bukti_transfer",
    );

    const updatedPayment = await this.repo.update(id, {
      buktiTransfer: imageUrl,
      statusPembayaran: "LUNAS",
    });

    if (updatedPayment.keterangan.toLowerCase().includes("booking fee")) {
      const spr = await this.sprRepo.findById(updatedPayment.sprId);

      if (spr?.status === "DRAFT") {
        await this.sprRepo.update(spr.id, { status: "AKTIF" });

        const existingProgress = await this.masterDataProgressRepo.findBySprId(
          spr.id,
        );
        if (!existingProgress) {
          await this.masterDataProgressRepo.create({ sprId: spr.id });
        }
      }
    }

    return SprPaymentMapper.toDomain(updatedPayment);
  }
}
