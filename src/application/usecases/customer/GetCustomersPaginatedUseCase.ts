import type { ICustomerRepository } from "../../../domain/repositories/ICustomerRepo.js";
import type {
  CustomerFilterDTO,
  CustomerResponseDTO,
} from "../../../domain/dtos/CustomerDTO.js";
import type { OffsetPaginatedData } from "../../../types/response.js";
import { CustomerMapper } from "../../../infrastructure/mapper/CustomerMapper.js";

export class GetCustomersPaginatedUseCase {
  constructor(private readonly customerRepo: ICustomerRepository) {}

  async execute(
    page: number,
    limit: number,
    filters?: CustomerFilterDTO,
  ): Promise<OffsetPaginatedData<CustomerResponseDTO>> {
    const result = await this.customerRepo.findWithOffsetPagination(
      page,
      limit,
      filters,
    );

    return {
      items: result.items.map((customer) => CustomerMapper.toDomain(customer)),
      meta: result.meta,
    };
  }
}
