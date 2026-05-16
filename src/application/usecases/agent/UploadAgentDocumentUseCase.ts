import type { IAgentRepository } from "../../../domain/repositories/IAgentRepo.js";
import type { CloudinaryService } from "../../../infrastructure/external/CloudinaryService.js";
import type { AgentEntity } from "../../../domain/entities/Agent.js";
import { NotFoundError } from "../../../domain/errors/NotFoundError.js";
import { AppError } from "../../../domain/errors/AppError.js";
import { StatusCodes } from "http-status-codes";

export class UploadAgentDocumentUseCase {
  constructor(
    private readonly repo: IAgentRepository,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async execute(
    id: number,
    fileBuffer: Buffer,
    documentType: string,
  ): Promise<AgentEntity> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError("Agent tidak ditemukan");
    if (!fileBuffer)
      throw new AppError(StatusCodes.BAD_REQUEST, "File tidak boleh kosong");

    const allowedTypes = [
      "fileKtp",
      "fileNpwp",
      "kwitansiBookingFee",
      "fileSuratPernyataan",
      "fileSuratKeterangan",
      "fileKtpDirektur",
      "fileNpwpPerusahaan",
    ];

    if (!allowedTypes.includes(documentType)) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Tipe dokumen tidak valid");
    }

    const currentDoc = existing[documentType as keyof AgentEntity] as
      | string
      | null;
    if (currentDoc) {
      await this.cloudinaryService.deleteImageByUrl(currentDoc);
    }

    const imageUrl = await this.cloudinaryService.uploadImage(
      fileBuffer,
      `bumantara/agents/${documentType}`,
    );

    return await this.repo.update(id, { [documentType]: imageUrl });
  }
}
