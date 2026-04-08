import { describe, it, expect, beforeEach, vi } from "vitest";
import { mock, type MockProxy } from "vitest-mock-extended";
import { DeleteUnitUseCase } from "./DeleteUnitUseCase";
import type { IUnitRepository } from "../../../domain/repositories/IUnitRepo";

describe("DeleteUnitUseCase", () => {
  let unitRepoMock: MockProxy<IUnitRepository>;
  let deleteUnitUseCase: DeleteUnitUseCase;

  beforeEach(() => {
    unitRepoMock = mock<IUnitRepository>();
    deleteUnitUseCase = new DeleteUnitUseCase(unitRepoMock);
    vi.clearAllMocks();
  });

  it("harus memanggil unitRepo.delete dengan id yang benar", async () => {
    const unitId = 1;
    unitRepoMock.delete.mockResolvedValue();

    await deleteUnitUseCase.execute(unitId);

    expect(unitRepoMock.delete).toHaveBeenCalledWith(unitId);
    expect(unitRepoMock.delete).toHaveBeenCalledTimes(1);
  });
});
