import type { Customer as PrismaCustomer } from "@prisma/client";
import type { CustomerEntity } from "../../domain/entities/Customer.js";

export class CustomerMapper {
  static toDomain(prismaCustomer: PrismaCustomer): CustomerEntity {
    return {
      id: prismaCustomer.id,
      nikKtp: prismaCustomer.nikKtp,
      nama: prismaCustomer.nama,
      noHp: prismaCustomer.noHp,
      email: prismaCustomer.email,
      pekerjaan: prismaCustomer.pekerjaan,
      perusahaan: prismaCustomer.perusahaan,
      bank: prismaCustomer.bank,
      alamatKoresponden: prismaCustomer.alamatKoresponden,
      alamatKtp: prismaCustomer.alamatKtp,
      alamatTinggal: prismaCustomer.alamatTinggal,
      fileKtp: prismaCustomer.fileKtp,
      fileKk: prismaCustomer.fileKk,
      fileNpwp: prismaCustomer.fileNpwp,
      dokumenLainnya: prismaCustomer.dokumenLainnya ?? [],
      userId: prismaCustomer.userId,
      hasAccount: prismaCustomer.userId !== null,
      createdAt: prismaCustomer.createdAt,
      updatedAt: prismaCustomer.updatedAt,
    };
  }
}
