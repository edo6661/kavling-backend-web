import type { ICustomerRepository } from "../../../domain/repositories/ICustomerRepo.js";
import type {
  UpdateCustomerDTO,
  CustomerResponseDTO,
} from "../../../domain/dtos/CustomerDTO.js";
import { CustomerMapper } from "../../../infrastructure/mapper/CustomerMapper.js";

export class UpdateCustomerUseCase {
  constructor(private readonly customerRepo: ICustomerRepository) {}

  async execute(
    id: number,
    data: UpdateCustomerDTO,
  ): Promise<CustomerResponseDTO> {
    const customer = await this.customerRepo.update(id, data);
    return CustomerMapper.toDomain(customer);
  }
}
