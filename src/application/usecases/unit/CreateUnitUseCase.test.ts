import { describe, it, expect, beforeEach, vi } from "vitest";
import { mock, type MockProxy } from "vitest-mock-extended";
import { CreateUnitUseCase } from "./CreateUnitUseCase";
import type { IUnitRepository } from "../../../domain/repositories/IUnitRepo";
import { UnitStatus } from "@prisma/client";

describe("CreateUnitUseCase", () => {
  let unitRepoMock: MockProxy<IUnitRepository>;
  let createUnitUseCase: CreateUnitUseCase;

  beforeEach(() => {
    unitRepoMock = mock<IUnitRepository>();
    createUnitUseCase = new CreateUnitUseCase(unitRepoMock);
    vi.clearAllMocks();
  });

  it("harus berhasil membuat unit baru dan mengembalikan DTO yang sesuai", async () => {
    const payload = {
      namaPerumahan: "Bumantara",
      blokUnit: "A1",
      tipe: "36/60",
      luasTanah: 60,
      luasBangunan: 36,
      lantai: 1,
      lokasiStrategis: "Dekat Taman",
      status: UnitStatus.TERSEDIA,
    };

    const createdUnit = {
      id: 1,
      ...payload,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    unitRepoMock.create.mockResolvedValue(createdUnit);

    const result = await createUnitUseCase.execute(payload);

    expect(unitRepoMock.create).toHaveBeenCalledWith(payload);
    expect(result).toEqual({
      id: createdUnit.id,
      namaPerumahan: createdUnit.namaPerumahan,
      blokUnit: createdUnit.blokUnit,
      tipe: createdUnit.tipe,
      luasTanah: createdUnit.luasTanah,
      luasBangunan: createdUnit.luasBangunan,
      lantai: createdUnit.lantai,
      lokasiStrategis: createdUnit.lokasiStrategis,
      status: createdUnit.status,
      createdAt: createdUnit.createdAt,
    });
  });
});
