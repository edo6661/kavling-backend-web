import type { ICustomerRepository } from "../../../domain/repositories/ICustomerRepo.js";
import type { CloudinaryService } from "../../../infrastructure/external/CloudinaryService.js";
import type { CustomerResponseDTO } from "../../../domain/dtos/CustomerDTO.js";
import { CustomerMapper } from "../../../infrastructure/mapper/CustomerMapper.js";
import { NotFoundError } from "../../../domain/errors/NotFoundError.js";
import { AppError } from "../../../domain/errors/AppError.js";
import { StatusCodes } from "http-status-codes";

// Definisikan struktur JSON yang diharapkan untuk menghindari tipe 'any'
interface IDokumenLainnya {
  id: string;
  nama: string;
  fileUrl: string | string[];
}

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

      // Type-casting yang aman dari Prisma JSON ke interface yang kita buat
      const currentDocs: IDokumenLainnya[] = Array.isArray(
        existing.dokumenLainnya,
      )
        ? (existing.dokumenLainnya as unknown as IDokumenLainnya[])
        : [];

      const existingDocIndex = currentDocs.findIndex(
        (doc) => doc.nama.toLowerCase() === namaDokumen.toLowerCase(),
      );

      if (existingDocIndex >= 0) {
        // Gabungkan array fileUrl jika nama dokumen sudah ada
        const doc = currentDocs[existingDocIndex]!;
        const fileUrls = Array.isArray(doc.fileUrl)
          ? doc.fileUrl
          : [doc.fileUrl];

        currentDocs[existingDocIndex] = {
          ...doc,
          fileUrl: [...fileUrls, imageUrl],
        };
      } else {
        // Buat grup baru dengan fileUrl berupa Array jika belum ada
        const newDoc: IDokumenLainnya = {
          id: Date.now().toString(),
          nama: namaDokumen,
          fileUrl: [imageUrl],
        };
        currentDocs.push(newDoc);
      }

      // Update data JSON
      const updateData = { dokumenLainnya: currentDocs };
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
