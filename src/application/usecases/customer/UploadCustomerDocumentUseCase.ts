import type { ICustomerRepository } from "../../../domain/repositories/ICustomerRepo.js";
import type { CloudinaryService } from "../../../infrastructure/external/CloudinaryService.js";
import type { CustomerResponseDTO } from "../../../domain/dtos/CustomerDTO.js";
import { CustomerMapper } from "../../../infrastructure/mapper/CustomerMapper.js";
import { NotFoundError } from "../../../domain/errors/NotFoundError.js";
import { AppError } from "../../../domain/errors/AppError.js";
import { StatusCodes } from "http-status-codes";
export class UploadCustomerDocumentUseCase {
  constructor(
    private readonly customerRepo: ICustomerRepository,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async execute(
    id: number,
    fileBuffer: Buffer,
    documentType: "fileKtp" | "fileKk" | "fileNpwp" | "lainnya",
    namaDokumen?: string,
  ): Promise<CustomerResponseDTO> {
    const existing = await this.customerRepo.findById(id);
    if (!existing) throw new NotFoundError("Customer tidak ditemukan");
    if (!fileBuffer)
      throw new AppError(StatusCodes.BAD_REQUEST, "File tidak boleh kosong");

    if (documentType === "lainnya") {
      if (!namaDokumen)
        throw new AppError(StatusCodes.BAD_REQUEST, "Nama dokumen wajib diisi");

      const imageUrl = await this.cloudinaryService.uploadImage(
        fileBuffer,
        `bumantara/customers/lainnya`,
      );

      const currentDocs = Array.isArray(existing.dokumenLainnya)
        ? existing.dokumenLainnya
        : [];
      const newDoc = {
        id: Date.now().toString(),
        nama: namaDokumen,
        fileUrl: imageUrl,
      };

      const updateData = { dokumenLainnya: [...currentDocs, newDoc] as any };
      const result = await this.customerRepo.update(id, updateData);
      return CustomerMapper.toDomain(result);
    }

    if (existing[documentType]) {
      await this.cloudinaryService.deleteImageByUrl(existing[documentType]);
    }
    const imageUrl = await this.cloudinaryService.uploadImage(
      fileBuffer,
      `bumantara/customers/${documentType}`,
    );
    const result = await this.customerRepo.update(id, {
      [documentType]: imageUrl,
    });
    return CustomerMapper.toDomain(result);
  }
}
