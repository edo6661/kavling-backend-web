import type { PrismaClient } from "@prisma/client";
import { Prisma } from "@prisma/client";
import type { Prisma as PrismaTypes } from "@prisma/client";
import type {
  CreateProgressProyekDTO,
  ProgressProyekListFilterDTO,
  ProgressProyekListItemDTO,
  UpdateProgressProyekDTO,
} from "../dtos/ProgressProyekDTO.js";
import type { ProgressProyekEntity } from "../entities/ProgressProyek.js";
import {
  ProgressProyekMapper,
} from "../../infrastructure/mapper/ProgressProyekMapper.js";
import { NotFoundError } from "../errors/NotFoundError.js";
import { ConflictError } from "../errors/ConflictError.js";
import type { IProgressProyekRepository } from "./IProgressProyekRepo.js";
import type { OffsetPaginatedData } from "../../types/response.js";
import { penjualanKavlingWithSpkInclude } from "./IPenjualanRepo.js";
import { compareProgressProyekList } from "../../utils/kavlingSort.js";

type ProgressProyekSummary = NonNullable<
  ProgressProyekListItemDTO["progressProyek"]
>;

type PenjualanListRow = PrismaTypes.PenjualanGetPayload<{
  select: {
    id: true;
    noTransaksi: true;
    status: true;
    customer: { select: { nama: true } };
    kavling: {
      select: {
        id: true;
        blok: true;
        nomorUnit: true;
        spkItem: {
          include: {
            spk: {
              include: { mandor: { select: { id: true; username: true } } };
            };
          };
        };
      };
    };
    progressProyek: {
      include: { mandor: { select: { id: true; username: true } } };
    };
  };
}>;

export class ProgressProyekRepository implements IProgressProyekRepository {
  constructor(private readonly db: PrismaClient) {}

  private resolveProgressProyekSummary(
    progressProyek: PenjualanListRow["progressProyek"],
    spkItem: PenjualanListRow["kavling"]["spkItem"],
  ): ProgressProyekSummary | null {
    if (progressProyek) {
      return {
        persentase: Number(progressProyek.persentase),
        mandorId: progressProyek.mandorId,
        mandor: progressProyek.mandor,
      };
    }

    const spk = spkItem?.spk;
    if (!spk) return null;

    return {
      persentase: 0,
      mandorId: spk.mandorId,
      mandor: spk.mandor,
    };
  }

  private buildMandorPenjualanWhere(
    mandorUserId: number,
  ): PrismaTypes.PenjualanWhereInput {
    return {
      OR: [
        { progressProyek: { mandorId: mandorUserId } },
        {
          kavling: {
            spkItem: { spk: { mandorId: mandorUserId } },
          } as PrismaTypes.KavlingWhereInput,
        },
      ],
    };
  }

  async findProyekListPaginated(
    page: number,
    limit: number,
    filters?: ProgressProyekListFilterDTO,
  ): Promise<OffsetPaginatedData<ProgressProyekListItemDTO>> {
    const penjualanWhere: PrismaTypes.PenjualanWhereInput = {
      status: { not: "BATAL" },
    };

    if (filters?.mandorUserId) {
      penjualanWhere.AND = [
        this.buildMandorPenjualanWhere(filters.mandorUserId),
      ];
    }

    const penjualanRows = await this.db.penjualan.findMany({
      where: penjualanWhere,
      select: {
        id: true,
        noTransaksi: true,
        status: true,
        customer: { select: { nama: true } },
        kavling: {
          select: {
            id: true,
            blok: true,
            nomorUnit: true,
            spkItem: penjualanKavlingWithSpkInclude.spkItem,
          },
        },
        progressProyek: {
          include: { mandor: { select: { id: true, username: true } } },
        },
      },
    });

    const kavlingWhere: PrismaTypes.KavlingWhereInput = {
      penjualan: { none: { status: { not: "BATAL" } } },
      spkItem: filters?.mandorUserId
        ? { is: { spk: { mandorId: filters.mandorUserId } } }
        : { isNot: null },
    };

    const kavlingOnlyRows = await this.db.kavling.findMany({
      where: kavlingWhere,
      include: {
        spkItem: penjualanKavlingWithSpkInclude.spkItem,
      },
    });

    const penjualanItems: ProgressProyekListItemDTO[] = penjualanRows.map(
      (item) => {
        const progressProyek = this.resolveProgressProyekSummary(
          item.progressProyek,
          item.kavling.spkItem,
        );

        return {
          kavlingId: item.kavling.id,
          penjualanId: item.id,
          penjualanNoTransaksi: item.noTransaksi,
          blok: item.kavling.blok,
          nomorUnit: item.kavling.nomorUnit,
          nama: item.customer.nama,
          status: item.status,
          progressProyek,
        };
      },
    );

    const kavlingOnlyItems: ProgressProyekListItemDTO[] = kavlingOnlyRows.map(
      (k) => {
        const spk = k.spkItem?.spk;
        const progressProyek: ProgressProyekSummary | null = spk
          ? {
              persentase: 0,
              mandorId: spk.mandorId,
              mandor: spk.mandor,
            }
          : null;

        return {
          kavlingId: k.id,
          penjualanId: null,
          penjualanNoTransaksi: null,
          blok: k.blok,
          nomorUnit: k.nomorUnit,
          nama: "-",
          status: "BELUM_TERJUAL",
          progressProyek,
        };
      },
    );

    const allItems = [...penjualanItems, ...kavlingOnlyItems].sort((a, b) =>
      compareProgressProyekList(
        {
          hasMandor: !!a.progressProyek?.mandorId,
          blok: a.blok,
          nomorUnit: a.nomorUnit,
        },
        {
          hasMandor: !!b.progressProyek?.mandorId,
          blok: b.blok,
          nomorUnit: b.nomorUnit,
        },
      ),
    );

    const totalItems = allItems.length;
    const totalPages = Math.ceil(totalItems / limit) || 1;
    const skip = (page - 1) * limit;
    const items = allItems.slice(skip, skip + limit);

    return {
      items,
      meta: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  private async getSpkMandorForPenjualan(penjualanId: number) {
    const penjualan = await this.db.penjualan.findUnique({
      where: { id: penjualanId },
      select: { kavlingId: true },
    });
    if (!penjualan) return null;

    const link = await this.db.spkPenjualan.findUnique({
      where: { kavlingId: penjualan.kavlingId },
      include: {
        spk: {
          include: { mandor: { select: { id: true, username: true } } },
        },
      },
    });
    if (!link) return null;

    return {
      mandorId: link.spk.mandorId,
      mandor: link.spk.mandor,
    };
  }

  private applySpkMandorFallback(
    entity: ProgressProyekEntity,
    spkMandor: { mandorId: number; mandor: ProgressProyekEntity["mandor"] } | null,
  ): ProgressProyekEntity {
    if (!spkMandor || entity.mandorId) return entity;
    return {
      ...entity,
      mandorId: spkMandor.mandorId,
      mandor: spkMandor.mandor,
    };
  }

  async create(data: CreateProgressProyekDTO): Promise<ProgressProyekEntity> {
    const existing = await this.findByPenjualanId(data.penjualanId);
    if (existing) {
      throw new ConflictError("Progress Proyek untuk penjualan ini sudah ada.");
    }

    let mandorId = data.mandorId ?? null;
    if (mandorId === null) {
      const spkMandor = await this.getSpkMandorForPenjualan(data.penjualanId);
      mandorId = spkMandor?.mandorId ?? null;
    }

    const result = await this.db.progressProyek.create({
      data: {
        penjualanId: data.penjualanId,
        mandorId,
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

    const entity = ProgressProyekMapper.toDomain(result);
    const spkMandor = await this.getSpkMandorForPenjualan(penjualanId);
    return this.applySpkMandorFallback(entity, spkMandor);
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
