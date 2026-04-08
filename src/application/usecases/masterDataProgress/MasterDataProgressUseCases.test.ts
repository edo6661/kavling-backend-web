import { describe, it, expect, beforeEach, vi } from "vitest";
import { mock, type MockProxy } from "vitest-mock-extended";
import {
  CreateMasterDataProgressUseCase,
  UpdateMasterDataProgressUseCase,
  GetMasterDataProgressByIdUseCase,
  GetMasterDataProgressBySprIdUseCase,
  GetMasterDataProgressPaginatedUseCase,
} from "./MasterDataProgressUseCases";
import type { IMasterDataProgressRepository } from "../../../domain/repositories/IMasterDataProgressRepo";
import { NotFoundError } from "../../../domain/errors/NotFoundError";
import { Prisma } from "@prisma/client";

describe("MasterDataProgress Use Cases", () => {
  let repoMock: MockProxy<IMasterDataProgressRepository>;

  beforeEach(() => {
    repoMock = mock<IMasterDataProgressRepository>();
    vi.clearAllMocks();
  });

  describe("CreateMasterDataProgressUseCase", () => {
    it("harus berhasil menginisiasi data progress dan mengembalikan DTO", async () => {
      const useCase = new CreateMasterDataProgressUseCase(repoMock);
      const payload = { sprId: 1 };

      const mockResult = {
        id: 1,
        sprId: 1,
        tanggalAkadPpjb: null,
        statusAkadPpjb: null,
        totalNilaiRumah: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      repoMock.create.mockResolvedValue(mockResult as any);

      const result = await useCase.execute(payload);

      expect(repoMock.create).toHaveBeenCalledWith(payload);
      expect(result.id).toBe(1);
      expect(result.sprId).toBe(1);
    });
  });

  describe("UpdateMasterDataProgressUseCase", () => {
    it("harus berhasil memperbarui data progress", async () => {
      const useCase = new UpdateMasterDataProgressUseCase(repoMock);
      const payload = {
        statusAkadPpjb: "Selesai",
        totalNilaiRumah: 500000000,
      };

      const mockResult = {
        id: 1,
        sprId: 1,
        statusAkadPpjb: "Selesai",
        // Gunakan Prisma.Decimal asli agar isDecimal() bernilai true di mapper
        totalNilaiRumah: new Prisma.Decimal(500000000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      repoMock.update.mockResolvedValue(mockResult as any);

      const result = await useCase.execute(1, payload);

      expect(repoMock.update).toHaveBeenCalledWith(1, payload);
      expect(result.statusAkadPpjb).toBe("Selesai");
      expect(result.totalNilaiRumah).toBe(500000000);
    });
  });

  describe("GetMasterDataProgressByIdUseCase", () => {
    it("harus mengembalikan data progress jika ID ditemukan", async () => {
      const useCase = new GetMasterDataProgressByIdUseCase(repoMock);
      const mockResult = {
        id: 1,
        sprId: 10,
        statusAkadPpjb: "Proses",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      repoMock.findById.mockResolvedValue(mockResult as any);

      const result = await useCase.execute(1);

      expect(repoMock.findById).toHaveBeenCalledWith(1);
      expect(result.id).toBe(1);
      expect(result.sprId).toBe(10);
    });

    it("harus melempar NotFoundError jika ID tidak ditemukan", async () => {
      const useCase = new GetMasterDataProgressByIdUseCase(repoMock);
      repoMock.findById.mockResolvedValue(null);

      await expect(useCase.execute(99)).rejects.toThrow(NotFoundError);
      expect(repoMock.findById).toHaveBeenCalledWith(99);
    });
  });

  describe("GetMasterDataProgressBySprIdUseCase", () => {
    it("harus mengembalikan data progress berdasarkan sprId", async () => {
      const useCase = new GetMasterDataProgressBySprIdUseCase(repoMock);
      const mockResult = {
        id: 1,
        sprId: 15,
        statusAkadPpjb: "Selesai",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      repoMock.findBySprId.mockResolvedValue(mockResult as any);

      const result = await useCase.execute(15);

      expect(repoMock.findBySprId).toHaveBeenCalledWith(15);
      expect(result.sprId).toBe(15);
    });

    it("harus melempar NotFoundError jika progress untuk sprId tersebut belum dibuat", async () => {
      const useCase = new GetMasterDataProgressBySprIdUseCase(repoMock);
      repoMock.findBySprId.mockResolvedValue(null);

      await expect(useCase.execute(99)).rejects.toThrow(NotFoundError);
      await expect(useCase.execute(99)).rejects.toThrow(
        "Data progress untuk SPR ini belum dibuat",
      );
    });
  });

  describe("GetMasterDataProgressPaginatedUseCase", () => {
    it("harus mengembalikan data terpaginasi beserta meta datanya", async () => {
      const useCase = new GetMasterDataProgressPaginatedUseCase(repoMock);
      const mockResult = {
        items: [
          {
            id: 1,
            sprId: 1,
            statusAkadPpjb: "Selesai",
            // Gunakan Prisma.Decimal asli
            totalNilaiRumah: new Prisma.Decimal(300000000),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        meta: { nextCursor: null, hasNextPage: false },
      };

      repoMock.findWithCursorPagination.mockResolvedValue(mockResult as any);

      const filters = { statusAkadPpjb: "Selesai" };
      const result = await useCase.execute(10, undefined, filters);

      expect(repoMock.findWithCursorPagination).toHaveBeenCalledWith(
        10,
        undefined,
        filters,
      );
      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.totalNilaiRumah).toBe(300000000);
      expect(result.meta.hasNextPage).toBe(false);
    });
  });
});
