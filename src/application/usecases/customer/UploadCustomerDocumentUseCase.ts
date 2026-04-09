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
    documentType: "fileKtp" | "fileKk" | "fileNpwp",
  ): Promise<CustomerResponseDTO> {
    const existing = await this.customerRepo.findById(id);
    if (!existing) {
      throw new NotFoundError("Customer tidak ditemukan");
    }

    if (!fileBuffer) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "File dokumen tidak boleh kosong",
      );
    }

    if (existing[documentType]) {
      await this.cloudinaryService.deleteImageByUrl(existing[documentType]);
    }

    const imageUrl = await this.cloudinaryService.uploadImage(
      fileBuffer,
      `bumantara/customers/${documentType}`,
    );

    const updateData = {
      [documentType]: imageUrl,
    };

    const result = await this.customerRepo.update(id, updateData);

    return CustomerMapper.toDomain(result);
  }
}
