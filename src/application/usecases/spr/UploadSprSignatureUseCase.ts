import type { ISprRepository } from "../../../domain/repositories/ISprRepo.js";
import type { CloudinaryService } from "../../../infrastructure/external/CloudinaryService.js";
import type { SprResponseDTO } from "../../../domain/dtos/SprDTO.js";
import { SprMapper } from "../../../infrastructure/mapper/SprMapper.js";
import { NotFoundError } from "../../../domain/errors/NotFoundError.js";
import { AppError } from "../../../domain/errors/AppError.js";
import { StatusCodes } from "http-status-codes";

export type SignatureRole =
  | "pemesan"
  | "marketing"
  | "supervisor"
  | "manager"
  | "salesAdmin";

export class UploadSprSignatureUseCase {
  constructor(
    private readonly sprRepo: ISprRepository,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async execute(
    id: number,
    fileBuffer: Buffer,
    role: SignatureRole,
  ): Promise<SprResponseDTO> {
    const existing = await this.sprRepo.findById(id);
    if (!existing) {
      throw new NotFoundError("Data SPR tidak ditemukan");
    }

    if (!fileBuffer) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "File tanda tangan tidak boleh kosong",
      );
    }

    let fieldTtd: keyof typeof existing;
    let fieldTanggal: string;

    switch (role) {
      case "pemesan":
        fieldTtd = "ttdPemesan";
        fieldTanggal = "tanggalTtdPemesan";
        break;
      case "marketing":
        fieldTtd = "ttdMarketing";
        fieldTanggal = "tanggalTtdMarketing";
        break;
      case "supervisor":
        fieldTtd = "ttdSupervisor";
        fieldTanggal = "tanggalTtdSupervisor";
        break;
      case "manager":
        fieldTtd = "ttdManager";
        fieldTanggal = "tanggalTtdManager";
        break;
      case "salesAdmin":
        fieldTtd = "ttdSalesAdmin";
        fieldTanggal = "tanggalTtdSalesAdmin";
        break;
      default:
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          "Role penandatangan tidak valid",
        );
    }

    const oldSignatureUrl = existing[fieldTtd];
    if (oldSignatureUrl) {
      await this.cloudinaryService.deleteImageByUrl(oldSignatureUrl);
    }

    const imageUrl = await this.cloudinaryService.uploadImage(
      fileBuffer,
      `spr_signature_${role}`,
    );

    const updateData = {
      [fieldTtd]: imageUrl,
      [fieldTanggal]: new Date(),
    };

    const result = await this.sprRepo.update(id, updateData);
    return SprMapper.toDomain(result);
  }
}
