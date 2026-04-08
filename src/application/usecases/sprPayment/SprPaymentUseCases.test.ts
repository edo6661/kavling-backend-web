import { describe, it, expect, beforeEach, vi } from "vitest";
import { mock, type MockProxy } from "vitest-mock-extended";
import {
  CreateSprPaymentUseCase,
  UpdateSprPaymentUseCase,
  GetSprPaymentByIdUseCase,
  GetSprPaymentsPaginatedUseCase,
  DeleteSprPaymentUseCase,
  UploadBuktiTransferUseCase,
} from "./SprPaymentUseCases";
import type { ISprPaymentRepository } from "../../../domain/repositories/ISprPaymentRepo";
import type { CloudinaryService } from "../../../infrastructure/external/CloudinaryService";
import { NotFoundError } from "../../../domain/errors/NotFoundError";
import { AppError } from "../../../domain/errors/AppError";
import { PaymentStatus } from "@prisma/client";

describe("SprPayment Use Cases", () => {
  let repoMock: MockProxy<ISprPaymentRepository>;
  let cloudinaryMock: MockProxy<CloudinaryService>;

  beforeEach(() => {
    repoMock = mock<ISprPaymentRepository>();
    cloudinaryMock = mock<CloudinaryService>();
    vi.clearAllMocks();
  });

  describe("CreateSprPaymentUseCase", () => {
    it("harus berhasil membuat jadwal pembayaran dan mereturn DTO yang di-map", async () => {
      const useCase = new CreateSprPaymentUseCase(repoMock);
      const payload = {
        sprId: 1,
        keterangan: "Booking Fee",
        jatuhTempo: new Date(),
        nilai: 10000000,
      };

      const mockResult = {
        id: 1,
        ...payload,
        statusPembayaran: PaymentStatus.BELUM_BAYAR,
        buktiTransfer: null,
        createdAt: new Date(),
        updatedAt: new Date(),

        nilai: { toNumber: () => 10000000 },
      };

      repoMock.create.mockResolvedValue(mockResult as any);

      const result = await useCase.execute(payload);

      expect(repoMock.create).toHaveBeenCalledWith(payload);
      expect(result.id).toBe(1);
      expect(result.nilai).toBe(10000000);
    });
  });

  describe("UpdateSprPaymentUseCase", () => {
    it("harus berhasil mengupdate data pembayaran", async () => {
      const useCase = new UpdateSprPaymentUseCase(repoMock);
      const payload = { keterangan: "Pelunasan DP" };

      const mockResult = {
        id: 1,
        sprId: 1,
        keterangan: "Pelunasan DP",
        jatuhTempo: new Date(),
        statusPembayaran: PaymentStatus.BELUM_BAYAR,
        buktiTransfer: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        nilai: { toNumber: () => 5000000 },
      };

      repoMock.update.mockResolvedValue(mockResult as any);

      const result = await useCase.execute(1, payload);

      expect(repoMock.update).toHaveBeenCalledWith(1, payload);
      expect(result.keterangan).toBe("Pelunasan DP");
    });
  });

  describe("GetSprPaymentByIdUseCase", () => {
    it("harus mengembalikan data pembayaran jika ditemukan", async () => {
      const useCase = new GetSprPaymentByIdUseCase(repoMock);
      const mockResult = {
        id: 1,
        sprId: 1,
        keterangan: "Cicilan 1",
        jatuhTempo: new Date(),
        statusPembayaran: PaymentStatus.BELUM_BAYAR,
        buktiTransfer: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        nilai: { toNumber: () => 2000000 },
      };

      repoMock.findById.mockResolvedValue(mockResult as any);

      const result = await useCase.execute(1);

      expect(repoMock.findById).toHaveBeenCalledWith(1);
      expect(result.id).toBe(1);
    });

    it("harus melempar NotFoundError jika data pembayaran tidak ditemukan", async () => {
      const useCase = new GetSprPaymentByIdUseCase(repoMock);
      repoMock.findById.mockResolvedValue(null);

      await expect(useCase.execute(99)).rejects.toThrow(NotFoundError);
    });
  });

  describe("GetSprPaymentsPaginatedUseCase", () => {
    it("harus mengembalikan daftar pembayaran terpaginasi", async () => {
      const useCase = new GetSprPaymentsPaginatedUseCase(repoMock);
      const mockResult = {
        items: [
          {
            id: 1,
            sprId: 1,
            keterangan: "Cicilan 1",
            jatuhTempo: new Date(),
            statusPembayaran: PaymentStatus.BELUM_BAYAR,
            buktiTransfer: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            nilai: { toNumber: () => 2000000 },
          },
        ],
        meta: { nextCursor: null, hasNextPage: false },
      };

      repoMock.findWithCursorPagination.mockResolvedValue(mockResult as any);

      const result = await useCase.execute(10, undefined, { sprId: 1 });

      expect(repoMock.findWithCursorPagination).toHaveBeenCalledWith(
        10,
        undefined,
        { sprId: 1 },
      );
      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.nilai).toBe(2000000);
      expect(result.meta.hasNextPage).toBe(false);
    });
  });

  describe("DeleteSprPaymentUseCase", () => {
    it("harus memanggil repo.delete dengan id yang benar", async () => {
      const useCase = new DeleteSprPaymentUseCase(repoMock);
      repoMock.delete.mockResolvedValue();

      await useCase.execute(1);

      expect(repoMock.delete).toHaveBeenCalledWith(1);
    });
  });

  describe("UploadBuktiTransferUseCase", () => {
    it("harus melempar NotFoundError jika data pembayaran tidak ada", async () => {
      const useCase = new UploadBuktiTransferUseCase(repoMock, cloudinaryMock);
      repoMock.findById.mockResolvedValue(null);

      const dummyBuffer = Buffer.from("dummy data");
      await expect(useCase.execute(99, dummyBuffer)).rejects.toThrow(
        NotFoundError,
      );
    });

    it("harus melempar AppError jika file buffer kosong (undefined/null)", async () => {
      const useCase = new UploadBuktiTransferUseCase(repoMock, cloudinaryMock);
      repoMock.findById.mockResolvedValue({ id: 1 } as any);

      await expect(useCase.execute(1, null as any)).rejects.toThrow(AppError);
    });

    it("harus menghapus gambar lama jika sudah ada, upload gambar baru, dan update status ke MENUNGGU_KONFIRMASI", async () => {
      const useCase = new UploadBuktiTransferUseCase(repoMock, cloudinaryMock);
      const dummyBuffer = Buffer.from("dummy data");

      const existingData = {
        id: 1,
        buktiTransfer: "https://cloudinary.com/old_image.jpg",
      };

      const mockUpdatedData = {
        id: 1,
        sprId: 1,
        keterangan: "Cicilan 1",
        jatuhTempo: new Date(),
        statusPembayaran: PaymentStatus.MENUNGGU_KONFIRMASI,
        buktiTransfer: "https://cloudinary.com/new_image.jpg",
        createdAt: new Date(),
        updatedAt: new Date(),
        nilai: { toNumber: () => 2000000 },
      };

      repoMock.findById.mockResolvedValue(existingData as any);

      cloudinaryMock.deleteImageByUrl.mockResolvedValue();

      cloudinaryMock.uploadImage.mockResolvedValue(
        "https://cloudinary.com/new_image.jpg",
      );

      repoMock.update.mockResolvedValue(mockUpdatedData as any);

      const result = await useCase.execute(1, dummyBuffer);

      expect(cloudinaryMock.deleteImageByUrl).toHaveBeenCalledWith(
        "https://cloudinary.com/old_image.jpg",
      );

      expect(cloudinaryMock.uploadImage).toHaveBeenCalledWith(
        dummyBuffer,
        "bukti_transfer",
      );

      expect(repoMock.update).toHaveBeenCalledWith(1, {
        buktiTransfer: "https://cloudinary.com/new_image.jpg",
        statusPembayaran: "MENUNGGU_KONFIRMASI",
      });

      expect(result.buktiTransfer).toBe("https://cloudinary.com/new_image.jpg");
      expect(result.statusPembayaran).toBe(PaymentStatus.MENUNGGU_KONFIRMASI);
    });
  });
});
