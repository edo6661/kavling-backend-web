import type { PrismaClient } from "@prisma/client";
import { Prisma } from "@prisma/client";
import type {
  CreateProgressProyekDTO,
  UpdateProgressProyekDTO,
} from "../dtos/ProgressProyekDTO.js";
import type { ProgressProyekEntity } from "../entities/ProgressProyek.js";
import { ProgressProyekMapper } from "../../infrastructure/mapper/ProgressProyekMapper.js";
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
        pelaksana: data.pelaksana,
        persentase: 0,
      },
      include: { tahapan: true },
    });

    return ProgressProyekMapper.toDomain(result);
  }

  async findByPenjualanId(
    penjualanId: number,
  ): Promise<ProgressProyekEntity | null> {
    const result = await this.db.progressProyek.findUnique({
      where: { penjualanId },
      include: { tahapan: true },
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
      if (data.pelaksana !== undefined) {
        await tx.progressProyek.update({
          where: { penjualanId },
          data: { pelaksana: data.pelaksana },
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

        const allTahapan = await tx.tahapanProyek.findMany({
          where: { progressProyekId: existing.id },
          orderBy: [{ tanggal: "desc" }, { id: "desc" }],
        });

        const uniqueTahapan = new Map<string, number>();
        allTahapan.forEach((t) => {
          if (!uniqueTahapan.has(t.namaTahapan)) {
            uniqueTahapan.set(t.namaTahapan, Number(t.persentase));
          }
        });

        const totalSum = Array.from(uniqueTahapan.values()).reduce(
          (sum, val) => sum + val,
          0,
        );

        const TOTAL_TAHAPAN = 9;
        const rataRataProgress = totalSum / TOTAL_TAHAPAN;
        const finalTotal = Math.min(rataRataProgress, 100);

        await tx.progressProyek.update({
          where: { penjualanId },
          data: {
            persentase: new Prisma.Decimal(finalTotal.toFixed(2)),
          },
        });
      }

      const finalResult = await tx.progressProyek.findUniqueOrThrow({
        where: { penjualanId },
        include: { tahapan: true },
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
    },
  ): Promise<ProgressProyekEntity> {
    return await this.db.$transaction(async (tx) => {
      let progress = await tx.progressProyek.findUnique({
        where: { penjualanId },
      });
      progress ??= await tx.progressProyek.create({ data: { penjualanId } });

      await tx.tahapanProyek.create({
        data: {
          progressProyekId: progress.id,
          namaTahapan: logData.namaTahapan,
          persentase: new Prisma.Decimal(logData.persentase),
          deskripsi: logData.deskripsi,
          tanggal: logData.tanggal,
          foto: logData.foto as Prisma.InputJsonValue,
        },
      });

      const allTahapan = await tx.tahapanProyek.findMany({
        where: { progressProyekId: progress.id },
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
        where: { id: progress.id },
        data: { persentase: new Prisma.Decimal(finalTotal.toFixed(2)) },
      });

      const updated = await tx.progressProyek.findUniqueOrThrow({
        where: { id: progress.id },
        include: { tahapan: true },
      });

      return ProgressProyekMapper.toDomain(updated);
    });
  }
}
