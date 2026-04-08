import type { ICustomerRepository } from "../../../domain/repositories/ICustomerRepo.js";
import type {
  CustomerFilterDTO,
  CustomerResponseDTO,
} from "../../../domain/dtos/CustomerDTO.js";
import type { CursorPaginatedData } from "../../../types/response.js";
import { CustomerMapper } from "../../../infrastructure/mapper/CustomerMapper.js";

export class GetCustomersPaginatedUseCase {
  constructor(private readonly customerRepo: ICustomerRepository) {}

  async execute(
    limit: number,
    cursor?: number,
    filters?: CustomerFilterDTO,
  ): Promise<CursorPaginatedData<CustomerResponseDTO>> {
    const result = await this.customerRepo.findWithCursorPagination(
      limit,
      cursor,
      filters,
    );

    return {
      items: result.items.map((customer) => CustomerMapper.toDomain(customer)),
      meta: result.meta,
    };
  }
}
