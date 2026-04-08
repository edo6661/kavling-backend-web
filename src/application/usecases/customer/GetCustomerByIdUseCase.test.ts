import { describe, it, expect, beforeEach, vi } from "vitest";
import { mock, type MockProxy } from "vitest-mock-extended";
import { GetCustomerByIdUseCase } from "./GetCustomerByIdUseCase";
import type { ICustomerRepository } from "../../../domain/repositories/ICustomerRepo";
import { NotFoundError } from "../../../domain/errors/NotFoundError";

describe("GetCustomerByIdUseCase", () => {
  let customerRepoMock: MockProxy<ICustomerRepository>;
  let getCustomerByIdUseCase: GetCustomerByIdUseCase;

  beforeEach(() => {
    customerRepoMock = mock<ICustomerRepository>();
    getCustomerByIdUseCase = new GetCustomerByIdUseCase(customerRepoMock);
    vi.clearAllMocks();
  });

  it("harus mengembalikan data customer jika ditemukan", async () => {
    const mockCustomer = {
      id: 1,
      nikKtp: "3201234567890123",
      nama: "Budi Santoso",
      noHp: "081234567890",
      email: null,
      pekerjaan: null,
      alamatKtp: "Jl. Merdeka No. 1",
      alamatTinggal: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    customerRepoMock.findById.mockResolvedValue(mockCustomer as any);

    const result = await getCustomerByIdUseCase.execute(1);

    expect(customerRepoMock.findById).toHaveBeenCalledWith(1);
    expect(result.id).toBe(mockCustomer.id);
    expect(result.nama).toBe(mockCustomer.nama);
  });

  it("harus melempar NotFoundError jika customer tidak ditemukan", async () => {
    customerRepoMock.findById.mockResolvedValue(null);

    await expect(getCustomerByIdUseCase.execute(99)).rejects.toThrow(
      NotFoundError,
    );
  });
});
