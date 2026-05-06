import type { PrismaClient } from "@prisma/client";
import { Prisma } from "@prisma/client";
import type { IProgressPenjualanRepository } from "./IProgressPenjualanRepo.js";
import type {
  CreateProgressPenjualanDTO,
  UpdateProgressPenjualanDTO,
  ProgressPenjualanResponseDTO,
} from "../dtos/ProgressPenjualanDTO.js";
import { ProgressPenjualanMapper } from "../../infrastructure/mapper/ProgressPenjualanMapper.js";
import { NotFoundError } from "../errors/NotFoundError.js";
import { ConflictError } from "../errors/ConflictError.js";

export class ProgressPenjualanRepository implements IProgressPenjualanRepository {
  constructor(private readonly db: PrismaClient) {}

  async create(
    data: CreateProgressPenjualanDTO,
  ): Promise<ProgressPenjualanResponseDTO> {
    const existing = await this.findByPenjualanId(data.penjualanId);
    if (existing) {
      throw new ConflictError(
        "Progress Penjualan untuk transaksi ini sudah ada.",
      );
    }

    const result = await this.db.progressPenjualan.create({
      data: { penjualanId: data.penjualanId },
    });

    return ProgressPenjualanMapper.toDomain(result);
  }

  async findByPenjualanId(
    penjualanId: number,
  ): Promise<ProgressPenjualanResponseDTO | null> {
    const result = await this.db.progressPenjualan.findUnique({
      where: { penjualanId },
    });
    if (!result) return null;
    return ProgressPenjualanMapper.toDomain(result);
  }

  async update(
    penjualanId: number,
    data: UpdateProgressPenjualanDTO,
  ): Promise<ProgressPenjualanResponseDTO> {
    const existing = await this.findByPenjualanId(penjualanId);
    if (!existing) {
      throw new NotFoundError("Progress Penjualan tidak ditemukan.");
    }

    const updateData: Prisma.ProgressPenjualanUpdateInput = {};

    if (data.berkasCustomerValid !== undefined)
      updateData.berkasCustomerValid = data.berkasCustomerValid;
    if (data.fileSp3k !== undefined) updateData.fileSp3k = data.fileSp3k;
    if (data.fileSalinanAjb !== undefined)
      updateData.fileSalinanAjb = data.fileSalinanAjb;
    if (data.filePpjb !== undefined) updateData.filePpjb = data.filePpjb;

    if (data.nilaiAjb !== undefined) {
      updateData.nilaiAjb = data.nilaiAjb ?? null;

      if (data.nilaiAjb) {
        updateData.biayaPph = data.nilaiAjb * 0.025;

        const dppBphtb = Math.max(0, data.nilaiAjb - 80000000);
        updateData.biayaBphtb = dppBphtb * 0.05;
      } else {
        updateData.biayaBphtb = null;
        updateData.biayaPph = null;
      }
    }

    if (data.fileAjb !== undefined) updateData.fileAjb = data.fileAjb;
    if (data.fileBast !== undefined) updateData.fileBast = data.fileBast;
    if (data.checklistBast !== undefined) {
      updateData.checklistBast =
        data.checklistBast === null
          ? Prisma.DbNull
          : (data.checklistBast as Prisma.InputJsonValue);
    }

    const result = await this.db.progressPenjualan.update({
      where: { penjualanId },
      data: updateData,
    });

    return ProgressPenjualanMapper.toDomain(result);
  }
}
