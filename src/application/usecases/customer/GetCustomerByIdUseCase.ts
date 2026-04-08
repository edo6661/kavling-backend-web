import type { ICustomerRepository } from "../../../domain/repositories/ICustomerRepo.js";
import type { CustomerResponseDTO } from "../../../domain/dtos/CustomerDTO.js";
import { NotFoundError } from "../../../domain/errors/NotFoundError.js";
import { CustomerMapper } from "../../../infrastructure/mapper/CustomerMapper.js";

export class GetCustomerByIdUseCase {
  constructor(private readonly customerRepo: ICustomerRepository) {}

  async execute(id: number): Promise<CustomerResponseDTO> {
    const customer = await this.customerRepo.findById(id);
    if (!customer) {
      throw new NotFoundError("Customer tidak ditemukan");
    }
    return CustomerMapper.toDomain(customer);
  }
}
