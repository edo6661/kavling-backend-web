import type { PrismaClient } from "@prisma/client";
import { Prisma } from "@prisma/client";
import type {
  CreateProgressProyekDTO,
  UpdateProgressProyekDTO,
} from "../dtos/ProgressProyekDTO.js";
import type { ProgressProyekEntity } from "../entities/ProgressProyek.js";
import {
  ProgressProyekMapper,
} from "../../infrastructure/mapper/ProgressProyekMapper.js";
import { NotFoundError } from "../errors/NotFoundError.js";
import { ConflictError } from "../errors/ConflictError.js";
import type { IProgressProyekRepository } from "./IProgressProyekRepo.js";

export class ProgressProyekRepository implements IProgressProyekRepository {
  constructor(private readonly db: PrismaClient) {}

  async create(data: CreateProgressProyekDTO): Promise<ProgressProyekEntity> {
    const existing = await this.findByPenjualanId(data.penjualanId);
    if (existing) {
      throw new ConflictError("Progress Proyek untuk penjualan ini sudah ada.");
    }

    const result = await this.db.progressProyek.create({
      data: {
        penjualanId: data.penjualanId,
        mandorId: data.mandorId ?? null,
        persentase: 0,
      },
      include: ProgressProyekMapper.include,
    });

    return ProgressProyekMapper.toDomain(result);
  }

  async findByPenjualanId(
    penjualanId: number,
  ): Promise<ProgressProyekEntity | null> {
    const result = await this.db.progressProyek.findUnique({
      where: { penjualanId },
      include: ProgressProyekMapper.include,
    });

    if (!result) return null;
    return ProgressProyekMapper.toDomain(result);
  }

  async update(
    penjualanId: number,
    data: UpdateProgressProyekDTO,
  ): Promise<ProgressProyekEntity> {
    const existing = await this.findByPenjualanId(penjualanId);
    if (!existing) {
      throw new NotFoundError("Progress Proyek tidak ditemukan.");
    }

    return await this.db.$transaction(async (tx) => {
      if (data.mandorId !== undefined) {
        await tx.progressProyek.update({
          where: { penjualanId },
          data: { mandorId: data.mandorId },
        });
      }

      if (data.tahapan && data.tahapan.length > 0) {
        for (const t of data.tahapan) {
          await tx.tahapanProyek.create({
            data: {
              progressProyekId: existing.id,
              namaTahapan: t.namaTahapan,
              persentase: new Prisma.Decimal(t.persentase),
              deskripsi: t.deskripsi,
              tanggal: t.tanggal,
              foto: t.foto as Prisma.InputJsonValue,
            },
          });
        }

        await this.recalculatePersentase(tx, existing.id, penjualanId);
      }

      const finalResult = await tx.progressProyek.findUniqueOrThrow({
        where: { penjualanId },
        include: ProgressProyekMapper.include,
      });

      return ProgressProyekMapper.toDomain(finalResult);
    });
  }

  async addTahapanLog(
    penjualanId: number,
    logData: {
      namaTahapan: string;
      persentase: number;
      deskripsi: string;
      tanggal: Date;
      foto: string[];
      reportedById?: number | null;
    },
  ): Promise<ProgressProyekEntity> {
    return await this.db.$transaction(async (tx) => {
      let progress = await tx.progressProyek.findUnique({
        where: { penjualanId },
      });
      progress ??= await tx.progressProyek.create({
        data: { penjualanId },
        include: ProgressProyekMapper.include,
      });

      await tx.tahapanProyek.create({
        data: {
          progressProyekId: progress.id,
          namaTahapan: logData.namaTahapan,
          persentase: new Prisma.Decimal(logData.persentase),
          deskripsi: logData.deskripsi,
          tanggal: logData.tanggal,
          foto: logData.foto as Prisma.InputJsonValue,
          reportedById: logData.reportedById ?? null,
        },
      });

      await this.recalculatePersentase(tx, progress.id, penjualanId);

      const updated = await tx.progressProyek.findUniqueOrThrow({
        where: { id: progress.id },
        include: ProgressProyekMapper.include,
      });

      return ProgressProyekMapper.toDomain(updated);
    });
  }

  private async recalculatePersentase(
    tx: Prisma.TransactionClient,
    progressId: number,
    penjualanId: number,
  ) {
    const allTahapan = await tx.tahapanProyek.findMany({
      where: { progressProyekId: progressId },
      orderBy: [{ tanggal: "desc" }, { id: "desc" }],
    });

    const uniqueTahapan = new Map<string, number>();
    allTahapan.forEach((t) => {
      if (!uniqueTahapan.has(t.namaTahapan)) {
        uniqueTahapan.set(t.namaTahapan, Number(t.persentase));
      }
    });

    const totalSum = Array.from(uniqueTahapan.values()).reduce(
      (acc, val) => acc + val,
      0,
    );

    const TOTAL_TAHAPAN = 9;
    const rataRataProgress = totalSum / TOTAL_TAHAPAN;
    const finalTotal = Math.min(rataRataProgress, 100);

    await tx.progressProyek.update({
      where: { penjualanId },
      data: { persentase: new Prisma.Decimal(finalTotal.toFixed(2)) },
    });
  }
}
