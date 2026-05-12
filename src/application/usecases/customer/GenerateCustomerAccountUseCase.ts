import type { ICustomerRepository } from "../../../domain/repositories/ICustomerRepo.js";
import type { IUserRepository } from "../../../domain/repositories/IUserRepo.js";
import { NotFoundError } from "../../../domain/errors/NotFoundError.js";
import { ConflictError } from "../../../domain/errors/ConflictError.js";
import { hashPassword } from "../../../utils/hashing.js";
import { Role } from "@prisma/client";

export class GenerateCustomerAccountUseCase {
  constructor(
    private readonly customerRepo: ICustomerRepository,
    private readonly userRepo: IUserRepository,
  ) {}

  async execute(customerId: number) {
    const customer = await this.customerRepo.findById(customerId);
    if (!customer) {
      throw new NotFoundError("Data profil Customer tidak ditemukan.");
    }

    if (customer.userId) {
      throw new ConflictError(
        "Customer ini sudah memiliki akun portal yang tertaut.",
      );
    }

    const hashedPassword = await hashPassword(customer.nikKtp);
    const emailToUse = customer.email ?? `${customer.noHp}@customer.local`;

    const existingUser = await this.userRepo.findByEmail(emailToUse);
    if (existingUser) {
      throw new ConflictError(
        "Email customer ini sudah terdaftar sebagai User di dalam sistem.",
      );
    }

    const newUser = await this.userRepo.create({
      username: customer.noHp,
      email: emailToUse,
      password: hashedPassword,
      role: Role.CUSTOMER,
    });

    await this.customerRepo.update(customerId, {
      userId: newUser.id,
    });

    return {
      message:
        "Akun portal customer berhasil dibuat (Username: No HP, Password: NIK).",
      akun: {
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
      },
    };
  }
}
