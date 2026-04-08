import { describe, it, expect, beforeEach, vi } from "vitest";
import { mock, type MockProxy } from "vitest-mock-extended";
import { GetCustomersPaginatedUseCase } from "./GetCustomersPaginatedUseCase";
import type { ICustomerRepository } from "../../../domain/repositories/ICustomerRepo";

describe("GetCustomersPaginatedUseCase", () => {
  let customerRepoMock: MockProxy<ICustomerRepository>;
  let getCustomersPaginatedUseCase: GetCustomersPaginatedUseCase;

  beforeEach(() => {
    customerRepoMock = mock<ICustomerRepository>();
    getCustomersPaginatedUseCase = new GetCustomersPaginatedUseCase(
      customerRepoMock,
    );
    vi.clearAllMocks();
  });

  it("harus mengembalikan daftar customer beserta pagination meta", async () => {
    const mockResult = {
      items: [
        {
          id: 1,
          nikKtp: "3201234567890123",
          nama: "Budi Santoso",
          noHp: "081234567890",
          email: "budi@test.com",
          pekerjaan: "PNS",
          alamatKtp: "Jl. Merdeka",
          alamatTinggal: "Jl. Kemerdekaan",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      meta: { nextCursor: null, hasNextPage: false },
    };

    customerRepoMock.findWithCursorPagination.mockResolvedValue(
      mockResult as any,
    );

    const limit = 10;
    const result = await getCustomersPaginatedUseCase.execute(
      limit,
      undefined,
      { search: "Budi" },
    );

    expect(customerRepoMock.findWithCursorPagination).toHaveBeenCalledWith(
      limit,
      undefined,
      { search: "Budi" },
    );
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.nama).toBe("Budi Santoso");
    expect(result.meta).toEqual(mockResult.meta);
  });
});
