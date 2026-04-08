import { describe, it, expect, beforeEach, vi } from "vitest";
import { mock, type MockProxy } from "vitest-mock-extended";
import { GetUnitsPaginatedUseCase } from "./GetUnitsPaginatedUseCase";
import type { IUnitRepository } from "../../../domain/repositories/IUnitRepo";
import { UnitStatus } from "@prisma/client";

describe("GetUnitsPaginatedUseCase", () => {
  let unitRepoMock: MockProxy<IUnitRepository>;
  let getUnitsPaginatedUseCase: GetUnitsPaginatedUseCase;

  beforeEach(() => {
    unitRepoMock = mock<IUnitRepository>();
    getUnitsPaginatedUseCase = new GetUnitsPaginatedUseCase(unitRepoMock);
    vi.clearAllMocks();
  });

  it("harus mengembalikan daftar unit beserta pagination meta yang benar", async () => {
    const mockResult = {
      items: [
        {
          id: 1,
          namaPerumahan: "Bumantara",
          blokUnit: "A1",
          tipe: "36/60",
          luasTanah: 60,
          luasBangunan: 36,
          lantai: 1,
          lokasiStrategis: "Dekat Taman",
          status: UnitStatus.TERSEDIA,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      meta: { nextCursor: null, hasNextPage: false },
    };

    unitRepoMock.findWithCursorPagination.mockResolvedValue(mockResult);

    const limit = 10;
    const cursor = undefined;
    const filters = { status: UnitStatus.TERSEDIA };

    const result = await getUnitsPaginatedUseCase.execute(
      limit,
      cursor,
      filters,
    );

    expect(unitRepoMock.findWithCursorPagination).toHaveBeenCalledWith(
      limit,
      cursor,
      filters,
    );
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.namaPerumahan).toBe("Bumantara");
    expect(result.meta).toEqual(mockResult.meta);
  });
});
