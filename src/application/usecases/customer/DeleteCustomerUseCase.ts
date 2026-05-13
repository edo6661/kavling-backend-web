import type { ICustomerRepository } from "../../../domain/repositories/ICustomerRepo.js";
import type { CloudinaryService } from "../../../infrastructure/external/CloudinaryService.js";
import { NotFoundError } from "../../../domain/errors/NotFoundError.js";

interface IDokumenLainnya {
  id: string;
  nama: string;
  fileUrl: string | string[];
}

export class DeleteCustomerUseCase {
  constructor(
    private readonly customerRepo: ICustomerRepository,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async execute(id: number): Promise<void> {
    const customer = await this.customerRepo.findById(id);
    if (!customer) throw new NotFoundError("Customer tidak ditemukan");

    const filesToDelete = [
      customer.fileKtp,
      customer.fileKk,
      customer.fileNpwp,
    ].filter(Boolean) as string[];

    const docsLainnya =
      (customer.dokumenLainnya as unknown as IDokumenLainnya[]) || [];
    docsLainnya.forEach((doc) => {
      if (Array.isArray(doc.fileUrl)) filesToDelete.push(...doc.fileUrl);
      else if (typeof doc.fileUrl === "string") filesToDelete.push(doc.fileUrl);
    });

    for (const url of filesToDelete) {
      await this.cloudinaryService
        .deleteImageByUrl(url)
        .catch((err) =>
          console.error(`Gagal hapus file saat delete customer: ${url}`, err),
        );
    }

    await this.customerRepo.delete(id);
  }
}
