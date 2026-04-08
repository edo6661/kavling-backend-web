import { describe, it, expect, beforeEach, vi } from "vitest";
import { mock, type MockProxy } from "vitest-mock-extended";
import { CreateSprUseCase } from "./CreateSprUseCase";
import { GetSprByIdUseCase } from "./GetSprByIdUseCase";
import type { ISprRepository } from "../../../domain/repositories/ISprRepo";
import { NotFoundError } from "../../../domain/errors/NotFoundError";
import { CaraPembayaran, SprStatus } from "@prisma/client";

describe("Spr Use Cases", () => {
  let sprRepoMock: MockProxy<ISprRepository>;

  beforeEach(() => {
    sprRepoMock = mock<ISprRepository>();
    vi.clearAllMocks();
  });

  describe("CreateSprUseCase", () => {
    it("harus berhasil membuat SPR dan mereturn DTO yang di-map", async () => {
      const useCase = new CreateSprUseCase(sprRepoMock);
      const payload = {
        customerId: 1,
        unitId: 2,
        marketingUserId: 3,
        bankRekeningPtId: 4,
        hargaJual: 500000000,
        caraPembayaran: CaraPembayaran.KPR_BRI,
      };

      const mockCreatedSpr = {
        id: 1,
        nomorSpr: "SPR-123",
        ...payload,
        diskonPenjualan: null,
        paketPromosi: null,
        nilaiPengajuanKpr: null,
        status: SprStatus.AKTIF,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock return value dari ORM/Repo
      // Kita menggunakan 'as any' karena prisma mapper menggunakan Decimal
      sprRepoMock.create.mockResolvedValue({
        ...mockCreatedSpr,
        hargaJual: { toNumber: () => 500000000 },
      } as any);

      const result = await useCase.execute(payload);

      expect(sprRepoMock.create).toHaveBeenCalledWith(
        payload,
        expect.any(String),
      ); // Menguji pembuatan nomorSpr otomatis
      expect(result.hargaJual).toBe(500000000);
    });
  });

  describe("GetSprByIdUseCase", () => {
    it("harus mengembalikan data SPR jika ditemukan", async () => {
      const useCase = new GetSprByIdUseCase(sprRepoMock);
      sprRepoMock.findById.mockResolvedValue({
        id: 1,
        nomorSpr: "SPR-123",
        hargaJual: { toNumber: () => 500000000 },
      } as any);

      const result = await useCase.execute(1);
      expect(result.id).toBe(1);
      expect(sprRepoMock.findById).toHaveBeenCalledWith(1);
    });

    it("harus melempar NotFoundError jika SPR tidak ditemukan", async () => {
      const useCase = new GetSprByIdUseCase(sprRepoMock);
      sprRepoMock.findById.mockResolvedValue(null);

      await expect(useCase.execute(99)).rejects.toThrow(NotFoundError);
    });
  });
});
