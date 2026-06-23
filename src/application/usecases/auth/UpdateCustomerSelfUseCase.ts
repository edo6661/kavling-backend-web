import type { IUserRepository } from "../../../domain/repositories/IUserRepo.js";
import type { ICustomerRepository } from "../../../domain/repositories/ICustomerRepo.js";
import { hashPassword } from "../../../utils/hashing.js";
import { NotFoundError } from "../../../domain/errors/NotFoundError.js";
import { ConflictError } from "../../../domain/errors/ConflictError.js";
import type { MandorProfileDTO, UpdateUserDTO } from "../../../domain/dtos/UserDTO.js";
import type { MandorRekeningInput } from "../../../domain/mandor/mandorRekening.js";
import { Role } from "@prisma/client";
import { AppError } from "../../../domain/errors/AppError.js";
import { StatusCodes } from "http-status-codes";

export interface UpdateSelfDTO {
  username?: string;
  email?: string;
  password?: string;
  mandor?: MandorProfileDTO;
  mandorRekeningList?: MandorRekeningInput[];
}

export class UpdateCustomerSelfUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly customerRepo: ICustomerRepository,
  ) {}

  async execute(userId: number, data: UpdateSelfDTO) {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new NotFoundError("User tidak ditemukan");

    const updateData: UpdateUserDTO = {};

    if (data.username) {
      updateData.username = data.username;
    }

    if (data.email) {
      const existing = await this.userRepo.findByEmail(data.email);
      if (existing && existing.id !== userId) {
        throw new ConflictError("Email sudah digunakan oleh akun lain");
      }
      updateData.email = data.email;
    }

    if (data.password) {
      updateData.password = await hashPassword(data.password);
    }

    if (data.mandor) {
      if (user.role !== Role.MANDOR) {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          "Data rekening mandor hanya untuk akun role MANDOR.",
        );
      }
      updateData.mandor = data.mandor;
    }

    if (data.mandorRekeningList?.length) {
      if (user.role !== Role.MANDOR) {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          "Data rekening mandor hanya untuk akun role MANDOR.",
        );
      }
      updateData.mandorRekeningList = data.mandorRekeningList;
    }

    const updatedUser = await this.userRepo.update(userId, updateData);

    if (data.email) {
      const customer = await this.customerRepo.findByUserId(userId);
      if (customer) {
        await this.customerRepo.update(customer.id, { email: data.email });
      }
    }

    return {
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      role: updatedUser.role,
      mandor: updatedUser.mandor ?? null,
    };
  }
}
