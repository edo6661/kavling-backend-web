import type { ICustomerRepository } from "../../../domain/repositories/ICustomerRepo.js";

export class DeleteCustomerUseCase {
  constructor(private readonly customerRepo: ICustomerRepository) {}

  async execute(id: number): Promise<void> {
    await this.customerRepo.delete(id);
  }
}
