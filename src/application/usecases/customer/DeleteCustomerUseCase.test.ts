import { describe, it, expect, beforeEach, vi } from "vitest";
import { mock, type MockProxy } from "vitest-mock-extended";
import { DeleteCustomerUseCase } from "./DeleteCustomerUseCase";
import type { ICustomerRepository } from "../../../domain/repositories/ICustomerRepo";

describe("DeleteCustomerUseCase", () => {
  let customerRepoMock: MockProxy<ICustomerRepository>;
  let deleteCustomerUseCase: DeleteCustomerUseCase;

  beforeEach(() => {
    customerRepoMock = mock<ICustomerRepository>();
    deleteCustomerUseCase = new DeleteCustomerUseCase(customerRepoMock);
    vi.clearAllMocks();
  });

  it("harus memanggil customerRepo.delete dengan id yang benar", async () => {
    const customerId = 1;
    customerRepoMock.delete.mockResolvedValue();

    await deleteCustomerUseCase.execute(customerId);

    expect(customerRepoMock.delete).toHaveBeenCalledWith(customerId);
    expect(customerRepoMock.delete).toHaveBeenCalledTimes(1);
  });
});
