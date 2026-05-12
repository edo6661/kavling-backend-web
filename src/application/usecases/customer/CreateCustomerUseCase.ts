import type { ICustomerRepository } from "../../../domain/repositories/ICustomerRepo.js";
import type { IUserRepository } from "../../../domain/repositories/IUserRepo.js";
import type {
  CreateCustomerDTO,
  CustomerResponseDTO,
} from "../../../domain/dtos/CustomerDTO.js";
import { CustomerMapper } from "../../../infrastructure/mapper/CustomerMapper.js";
import { hashPassword } from "../../../utils/hashing.js";
import { Role } from "@prisma/client";

export class CreateCustomerUseCase {
  constructor(
    private readonly customerRepo: ICustomerRepository,
    private readonly userRepo: IUserRepository,
  ) {}

  async execute(data: CreateCustomerDTO): Promise<CustomerResponseDTO> {
    const hashedPassword = await hashPassword(data.nikKtp);
    const dummyEmail = data.email ?? `${data.noHp}@customer.local`;

    const newUser = await this.userRepo.create({
      username: data.noHp,
      email: dummyEmail,
      password: hashedPassword,
      role: Role.CUSTOMER,
    });

    const customer = await this.customerRepo.create({
      ...data,
      userId: newUser.id,
    });

    return CustomerMapper.toDomain(customer);
  }
}
