import { describe, it, expect, beforeEach, vi } from "vitest";
import { mock, type MockProxy } from "vitest-mock-extended";
import { UpdateUnitUseCase } from "./UpdateUnitUseCase";
import type { IUnitRepository } from "../../../domain/repositories/IUnitRepo";
import { UnitStatus } from "@prisma/client";

describe("UpdateUnitUseCase", () => {
  let unitRepoMock: MockProxy<IUnitRepository>;
  let updateUnitUseCase: UpdateUnitUseCase;

  beforeEach(() => {
    unitRepoMock = mock<IUnitRepository>();
    updateUnitUseCase = new UpdateUnitUseCase(unitRepoMock);
    vi.clearAllMocks();
  });

  it("harus berhasil memperbarui unit dan mengembalikan DTO yang sesuai", async () => {
    const unitId = 1;
    const updatePayload = {
      tipe: "45/90",
      status: UnitStatus.TERJUAL,
    };

    const updatedUnit = {
      id: unitId,
      namaPerumahan: "Bumantara",
      blokUnit: "A1",
      tipe: "45/90",
      luasTanah: 90,
      luasBangunan: 45,
      lantai: 1,
      lokasiStrategis: "Dekat Taman",
      status: UnitStatus.TERJUAL,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    unitRepoMock.update.mockResolvedValue(updatedUnit);

    const result = await updateUnitUseCase.execute(unitId, updatePayload);

    expect(unitRepoMock.update).toHaveBeenCalledWith(unitId, updatePayload);
    expect(result).toEqual({
      id: updatedUnit.id,
      namaPerumahan: updatedUnit.namaPerumahan,
      blokUnit: updatedUnit.blokUnit,
      tipe: updatedUnit.tipe,
      luasTanah: updatedUnit.luasTanah,
      luasBangunan: updatedUnit.luasBangunan,
      lantai: updatedUnit.lantai,
      lokasiStrategis: updatedUnit.lokasiStrategis,
      status: updatedUnit.status,
      createdAt: updatedUnit.createdAt,
    });
  });
});
