import { describe, it, expect, beforeEach, vi } from "vitest";
import { mock, type MockProxy } from "vitest-mock-extended";
import { GetUnitByIdUseCase } from "./GetUnitByIdUseCase";
import type { IUnitRepository } from "../../../domain/repositories/IUnitRepo";
import { NotFoundError } from "../../../domain/errors/NotFoundError";
import { UnitStatus } from "@prisma/client";

describe("GetUnitByIdUseCase", () => {
  let unitRepoMock: MockProxy<IUnitRepository>;
  let getUnitByIdUseCase: GetUnitByIdUseCase;

  beforeEach(() => {
    unitRepoMock = mock<IUnitRepository>();
    getUnitByIdUseCase = new GetUnitByIdUseCase(unitRepoMock);
    vi.clearAllMocks();
  });

  it("harus mengembalikan data unit jika ditemukan", async () => {
    const mockUnit = {
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
    };

    unitRepoMock.findById.mockResolvedValue(mockUnit);

    const result = await getUnitByIdUseCase.execute(1);

    expect(unitRepoMock.findById).toHaveBeenCalledWith(1);
    expect(result).toEqual({
      id: mockUnit.id,
      namaPerumahan: mockUnit.namaPerumahan,
      blokUnit: mockUnit.blokUnit,
      tipe: mockUnit.tipe,
      luasTanah: mockUnit.luasTanah,
      luasBangunan: mockUnit.luasBangunan,
      lantai: mockUnit.lantai,
      lokasiStrategis: mockUnit.lokasiStrategis,
      status: mockUnit.status,
      createdAt: mockUnit.createdAt,
    });
  });

  it("harus melempar NotFoundError jika unit tidak ditemukan", async () => {
    unitRepoMock.findById.mockResolvedValue(null);

    await expect(getUnitByIdUseCase.execute(99)).rejects.toThrow(NotFoundError);
    await expect(getUnitByIdUseCase.execute(99)).rejects.toThrow(
      "Unit tidak ditemukan",
    );
    expect(unitRepoMock.findById).toHaveBeenCalledWith(99);
  });
});
