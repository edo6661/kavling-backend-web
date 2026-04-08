import { describe, it, expect, beforeEach, vi } from "vitest";
import { mock, type MockProxy } from "vitest-mock-extended";
import { UpdateCustomerUseCase } from "./UpdateCustomerUseCase";
import type { ICustomerRepository } from "../../../domain/repositories/ICustomerRepo";

describe("UpdateCustomerUseCase", () => {
  let customerRepoMock: MockProxy<ICustomerRepository>;
  let updateCustomerUseCase: UpdateCustomerUseCase;

  beforeEach(() => {
    customerRepoMock = mock<ICustomerRepository>();
    updateCustomerUseCase = new UpdateCustomerUseCase(customerRepoMock);
    vi.clearAllMocks();
  });

  it("harus berhasil mengupdate customer dan mengembalikan DTO yang di-map", async () => {
    const customerId = 1;
    const updatePayload = {
      nama: "Budi Santoso Updated",
      noHp: "089999999999",
    };

    const updatedCustomer = {
      id: customerId,
      nikKtp: "3201234567890123",
      nama: updatePayload.nama,
      noHp: updatePayload.noHp,
      email: null,
      pekerjaan: null,
      alamatKtp: "Jl. Merdeka No. 1",
      alamatTinggal: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Cast menggunakan 'as any' untuk menghindari error strict type Prisma
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    customerRepoMock.update.mockResolvedValue(updatedCustomer as any);

    const result = await updateCustomerUseCase.execute(
      customerId,
      updatePayload,
    );

    expect(customerRepoMock.update).toHaveBeenCalledWith(
      customerId,
      updatePayload,
    );
    expect(result).toEqual({
      id: updatedCustomer.id,
      nikKtp: updatedCustomer.nikKtp,
      nama: updatedCustomer.nama,
      noHp: updatedCustomer.noHp,
      email: updatedCustomer.email,
      pekerjaan: updatedCustomer.pekerjaan,
      alamatKtp: updatedCustomer.alamatKtp,
      alamatTinggal: updatedCustomer.alamatTinggal,
      createdAt: updatedCustomer.createdAt,
      updatedAt: updatedCustomer.updatedAt,
    });
  });
});
