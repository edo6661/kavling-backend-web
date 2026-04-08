import { describe, it, expect, beforeEach, vi } from "vitest";
import { mock, type MockProxy } from "vitest-mock-extended";
import { CreateCustomerUseCase } from "./CreateCustomerUseCase";
import type { ICustomerRepository } from "../../../domain/repositories/ICustomerRepo";

describe("CreateCustomerUseCase", () => {
  let customerRepoMock: MockProxy<ICustomerRepository>;
  let createCustomerUseCase: CreateCustomerUseCase;

  beforeEach(() => {
    customerRepoMock = mock<ICustomerRepository>();
    createCustomerUseCase = new CreateCustomerUseCase(customerRepoMock);
    vi.clearAllMocks();
  });

  it("harus berhasil membuat customer baru dan mengembalikan DTO yang di-map", async () => {
    const payload = {
      nikKtp: "3201234567890123",
      nama: "Budi Santoso",
      noHp: "081234567890",
      alamatKtp: "Jl. Merdeka No. 1",
    };

    const createdCustomer = {
      id: 1,
      ...payload,
      email: null,
      pekerjaan: null,
      alamatTinggal: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    customerRepoMock.create.mockResolvedValue(createdCustomer as any);

    const result = await createCustomerUseCase.execute(payload);

    expect(customerRepoMock.create).toHaveBeenCalledWith(payload);
    expect(result).toEqual({
      id: createdCustomer.id,
      nikKtp: createdCustomer.nikKtp,
      nama: createdCustomer.nama,
      noHp: createdCustomer.noHp,
      email: createdCustomer.email,
      pekerjaan: createdCustomer.pekerjaan,
      alamatKtp: createdCustomer.alamatKtp,
      alamatTinggal: createdCustomer.alamatTinggal,
      createdAt: createdCustomer.createdAt,
      updatedAt: createdCustomer.updatedAt,
    });
  });
});
