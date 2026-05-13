import type { ICustomerRepository } from "../../../domain/repositories/ICustomerRepo.js";
import type {
  UpdateCustomerDTO,
  CustomerResponseDTO,
} from "../../../domain/dtos/CustomerDTO.js";
import { CustomerMapper } from "../../../infrastructure/mapper/CustomerMapper.js";
import type { CloudinaryService } from "../../../infrastructure/external/CloudinaryService.js";

interface IDokumenLainnya {
  id: string;
  nama: string;
  fileUrl: string | string[];
}

export class UpdateCustomerUseCase {
  constructor(
    private readonly customerRepo: ICustomerRepository,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async execute(
    id: number,
    data: UpdateCustomerDTO,
  ): Promise<CustomerResponseDTO> {
    const oldCustomer = await this.customerRepo.findById(id);

    if (oldCustomer && data.dokumenLainnya !== undefined) {
      const oldDocs =
        (oldCustomer.dokumenLainnya as unknown as IDokumenLainnya[]) || [];
      const newDocs =
        (data.dokumenLainnya as unknown as IDokumenLainnya[]) || [];

      const oldUrls: string[] = [];
      oldDocs.forEach((doc) => {
        if (Array.isArray(doc.fileUrl)) oldUrls.push(...doc.fileUrl);
        else if (typeof doc.fileUrl === "string") oldUrls.push(doc.fileUrl);
      });

      const newUrls: string[] = [];
      newDocs.forEach((doc) => {
        if (Array.isArray(doc.fileUrl)) newUrls.push(...doc.fileUrl);
        else if (typeof doc.fileUrl === "string") newUrls.push(doc.fileUrl);
      });

      const deletedUrls = oldUrls.filter((url) => !newUrls.includes(url));

      for (const url of deletedUrls) {
        await this.cloudinaryService
          .deleteImageByUrl(url)
          .catch((err) =>
            console.error(`Gagal menghapus dokumen lainnya: ${url}`, err),
          );
      }
    }

    const customer = await this.customerRepo.update(id, data);
    return CustomerMapper.toDomain(customer);
  }
}
