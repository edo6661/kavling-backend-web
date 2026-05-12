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

  async execute(customerId: number, passwordInput: string) {
    const customer = await this.customerRepo.findById(customerId);
    if (!customer) {
      throw new NotFoundError("Data profil Customer tidak ditemukan.");
    }

    const hashedPassword = await hashPassword(passwordInput);
    const emailToUse = customer.email ?? `${customer.noHp}@customer.local`;

    if (customer.userId) {
      const updatedUser = await this.userRepo.update(customer.userId, {
        password: hashedPassword,
      });
      return {
        message: "Kredensial portal customer berhasil di-reset.",
        akun: {
          username: updatedUser.username,
          email: updatedUser.email,
          role: updatedUser.role,
        },
      };
    }

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
      message: "Akun portal customer berhasil dibuat.",
      akun: {
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
      },
    };
  }
}
