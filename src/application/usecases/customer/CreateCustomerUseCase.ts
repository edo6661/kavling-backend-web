import type { ICustomerRepository } from "../../../domain/repositories/ICustomerRepo.js";
import type {
  CreateCustomerDTO,
  CustomerResponseDTO,
} from "../../../domain/dtos/CustomerDTO.js";
import { CustomerMapper } from "../../../infrastructure/mapper/CustomerMapper.js";

export class CreateCustomerUseCase {
  constructor(private readonly customerRepo: ICustomerRepository) {}

  async execute(data: CreateCustomerDTO): Promise<CustomerResponseDTO> {
    const customer = await this.customerRepo.create(data);
    return CustomerMapper.toDomain(customer);
  }
}
