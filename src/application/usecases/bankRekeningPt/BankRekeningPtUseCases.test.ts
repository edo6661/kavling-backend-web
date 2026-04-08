import { describe, it, expect, beforeEach, vi } from "vitest";
import { mock, type MockProxy } from "vitest-mock-extended";
import {
  CreateBankRekeningPtUseCase,
  UpdateBankRekeningPtUseCase,
  GetBankRekeningPtByIdUseCase,
  GetBankRekeningPtPaginatedUseCase,
  DeleteBankRekeningPtUseCase,
} from "./BankRekeningPtUseCases";
import type { IBankRekeningPtRepository } from "../../../domain/repositories/IBankRekeningPtRepo";
import { NotFoundError } from "../../../domain/errors/NotFoundError";

describe("BankRekeningPtUseCases", () => {
  let repoMock: MockProxy<IBankRekeningPtRepository>;

  beforeEach(() => {
    repoMock = mock<IBankRekeningPtRepository>();
    vi.clearAllMocks();
  });

  describe("CreateBankRekeningPtUseCase", () => {
    it("harus berhasil membuat rekening dan mereturn domain data", async () => {
      const useCase = new CreateBankRekeningPtUseCase(repoMock);
      const payload = {
        namaBank: "BCA",
        noRekening: "123456",
        atasNama: "PT ABC",
      };
      const mockResult = { id: 1, ...payload, createdAt: new Date() };

      repoMock.create.mockResolvedValue(mockResult);

      const result = await useCase.execute(payload);

      expect(repoMock.create).toHaveBeenCalledWith(payload);
      expect(result).toEqual(mockResult);
    });
  });

  describe("GetBankRekeningPtByIdUseCase", () => {
    it("harus mereturn data rekening jika ditemukan", async () => {
      const useCase = new GetBankRekeningPtByIdUseCase(repoMock);
      const mockResult = {
        id: 1,
        namaBank: "BCA",
        noRekening: "123456",
        atasNama: "PT ABC",
        createdAt: new Date(),
      };

      repoMock.findById.mockResolvedValue(mockResult);

      const result = await useCase.execute(1);

      expect(repoMock.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockResult);
    });

    it("harus melempar NotFoundError jika rekening tidak ditemukan", async () => {
      const useCase = new GetBankRekeningPtByIdUseCase(repoMock);
      repoMock.findById.mockResolvedValue(null);

      await expect(useCase.execute(99)).rejects.toThrow(NotFoundError);
    });
  });

  describe("UpdateBankRekeningPtUseCase", () => {
    it("harus berhasil mengupdate rekening", async () => {
      const useCase = new UpdateBankRekeningPtUseCase(repoMock);
      const payload = { namaBank: "Mandiri" };
      const mockResult = {
        id: 1,
        namaBank: "Mandiri",
        noRekening: "123456",
        atasNama: "PT ABC",
        createdAt: new Date(),
      };

      repoMock.update.mockResolvedValue(mockResult);

      const result = await useCase.execute(1, payload);

      expect(repoMock.update).toHaveBeenCalledWith(1, payload);
      expect(result).toEqual(mockResult);
    });
  });

  describe("GetBankRekeningPtPaginatedUseCase", () => {
    it("harus mereturn daftar rekening terpaginasi beserta meta datanya", async () => {
      const useCase = new GetBankRekeningPtPaginatedUseCase(repoMock);
      const mockResult = {
        items: [
          {
            id: 1,
            namaBank: "BCA",
            noRekening: "123456",
            atasNama: "PT ABC",
            createdAt: new Date(),
          },
        ],
        meta: { nextCursor: null, hasNextPage: false },
      };

      repoMock.findWithCursorPagination.mockResolvedValue(mockResult);

      const result = await useCase.execute(10, undefined, { search: "BCA" });

      expect(repoMock.findWithCursorPagination).toHaveBeenCalledWith(
        10,
        undefined,
        { search: "BCA" },
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe("DeleteBankRekeningPtUseCase", () => {
    it("harus memanggil repo.delete dengan id yang benar", async () => {
      const useCase = new DeleteBankRekeningPtUseCase(repoMock);
      repoMock.delete.mockResolvedValue();

      await useCase.execute(1);

      expect(repoMock.delete).toHaveBeenCalledWith(1);
    });
  });
});
