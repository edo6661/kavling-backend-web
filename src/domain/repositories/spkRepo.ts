import { Prisma, Role } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";
import type { ISpkRepository } from "./ISpkRepo.js";
import type { CreateSpkDTO, SpkFilterDTO, UpdateSpkDTO } from "../dtos/SpkDTO.js";
import type { SpkEntity } from "../entities/Spk.js";
import type { CursorPaginatedData, OffsetPaginatedData } from "../../types/response.js";
import type { SpkListSummary } from "../dtos/SpkDTO.js";
import { SpkMapper } from "../../infrastructure/mapper/SpkMapper.js";
import { NotFoundError } from "../errors/NotFoundError.js";
import { ConflictError } from "../errors/ConflictError.js";
import { AppError } from "../errors/AppError.js";
import { StatusCodes } from "http-status-codes";

export class SpkRepository implements ISpkRepository {
  constructor(private readonly db: PrismaClient) {}

  private async withComputedProgress(entity: SpkEntity): Promise<SpkEntity> {
    const override = entity.progressOverride;
    const progress =
      override != null ? Math.min(100, Math.max(0, override)) : 0;

    return {
      ...entity,
      progress,
      progressIsOverride: override != null,
    };
  }

  async findKavlingIdsAssignedToOtherSpk(
    kavlingIds: number[],
    excludeSpkId?: number,
  ): Promise<number[]> {
    if (kavlingIds.length === 0) return [];

    const rows = await this.db.spkPenjualan.findMany({
      where: {
        kavlingId: { in: kavlingIds },
        ...(excludeSpkId ? { spkId: { not: excludeSpkId } } : {}),
      },
      select: { kavlingId: true },
    });

    return rows.map((r) => r.kavlingId);
  }

  private async validateKavlingIds(
    tx: Prisma.TransactionClient,
    kavlingIds: number[],
    excludeSpkId?: number,
  ) {
    if (kavlingIds.length === 0) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "Minimal satu kavling harus dipilih.",
      );
    }

    const uniqueIds = [...new Set(kavlingIds)];
    if (uniqueIds.length !== kavlingIds.length) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "Terdapat kavling duplikat dalam daftar.",
      );
    }

    const kavlingList = await tx.kavling.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true },
    });

    if (kavlingList.length !== uniqueIds.length) {
      throw new NotFoundError("Salah satu kavling tidak ditemukan.");
    }

    const assignedElsewhere = await this.findKavlingIdsAssignedToOtherSpk(
      uniqueIds,
      excludeSpkId,
    );
    if (assignedElsewhere.length > 0) {
      throw new ConflictError(
        "Salah satu kavling sudah terdaftar di SPK lain.",
      );
    }
  }

  private async validateMandor(
    tx: Prisma.TransactionClient,
    mandorId: number,
  ) {
    const mandor = await tx.user.findFirst({
      where: { id: mandorId, role: Role.MANDOR },
    });
    if (!mandor) {
      throw new NotFoundError("Mandor tidak ditemukan.");
    }
  }

  private async syncMandorOnProgressForKavlings(
    tx: Prisma.TransactionClient,
    kavlingIds: number[],
    mandorId: number | null,
  ) {
    for (const kavlingId of kavlingIds) {
      const penjualan = await tx.penjualan.findFirst({
        where: { kavlingId, status: { not: "BATAL" } },
        orderBy: { id: "desc" },
        select: { id: true },
      });

      if (!penjualan) {
        await tx.progressProyek.upsert({
          where: { kavlingId },
          create: { kavlingId, mandorId },
          update: { mandorId },
        });
        continue;
      }

      await tx.progressProyek.upsert({
        where: { penjualanId: penjualan.id },
        create: { penjualanId: penjualan.id, mandorId },
        update: { mandorId },
      });
    }
  }

  async create(data: CreateSpkDTO): Promise<SpkEntity> {
    return await this.db.$transaction(async (tx) => {
      await this.validateMandor(tx, data.mandorId);
      await this.validateKavlingIds(tx, data.kavlingIds);

      const result = await tx.spk.create({
        data: {
          noSpk: data.noSpk,
          tanggalSpk: data.tanggalSpk,
          judulPekerjaan: data.judulPekerjaan,
          nilaiKontrak: new Prisma.Decimal(data.nilaiKontrak),
          bankRekeningPtId: data.bankRekeningPtId ?? null,
          nilaiSudahDibayarkan: new Prisma.Decimal(0),
          sisaNilaiKontrak: new Prisma.Decimal(data.nilaiKontrak),
          notesPekerjaan: data.notesPekerjaan ?? null,
          jatuhTempo: data.jatuhTempo ?? null,
          fileSpk: data.fileSpk ?? null,
          mandorId: data.mandorId,
          penjualanItems: {
            create: data.kavlingIds.map((kavlingId) => ({ kavlingId })),
          },
        },
        include: SpkMapper.include,
      });

      await this.syncMandorOnProgressForKavlings(
        tx,
        data.kavlingIds,
        data.mandorId,
      );

      return await this.withComputedProgress(SpkMapper.toDomain(result));
    });
  }

  async findById(id: number): Promise<SpkEntity | null> {
    const result = await this.db.spk.findUnique({
      where: { id },
      include: SpkMapper.include,
    });
    if (!result) return null;
    return await this.withComputedProgress(SpkMapper.toDomain(result));
  }

  async update(id: number, data: UpdateSpkDTO): Promise<SpkEntity> {
    const existing = await this.findById(id);
    if (!existing) throw new NotFoundError("SPK tidak ditemukan");

    return await this.db.$transaction(async (tx) => {
      const mandorId = data.mandorId ?? existing.mandorId;
      if (data.mandorId !== undefined) {
        await this.validateMandor(tx, mandorId);
      }

      let kavlingIds = existing.kavlingItems.map((p) => p.kavlingId);
      if (data.kavlingIds !== undefined) {
        await this.validateKavlingIds(tx, data.kavlingIds, id);
        kavlingIds = data.kavlingIds;

        const removedIds = existing.kavlingItems
          .map((p) => p.kavlingId)
          .filter((kid) => !kavlingIds.includes(kid));

        if (removedIds.length > 0) {
          await this.syncMandorOnProgressForKavlings(tx, removedIds, null);
        }

        await tx.spkPenjualan.deleteMany({ where: { spkId: id } });
        await tx.spkPenjualan.createMany({
          data: kavlingIds.map((kavlingId) => ({ spkId: id, kavlingId })),
        });
      }

      const updateData: Prisma.SpkUpdateInput = {};
      if (data.noSpk !== undefined) updateData.noSpk = data.noSpk;
      if (data.tanggalSpk !== undefined) updateData.tanggalSpk = data.tanggalSpk;
      if (data.judulPekerjaan !== undefined) {
        updateData.judulPekerjaan = data.judulPekerjaan;
      }
      if (data.nilaiKontrak !== undefined) {
        updateData.nilaiKontrak = new Prisma.Decimal(data.nilaiKontrak);
      }
      if (data.bankRekeningPtId !== undefined) {
        updateData.bankRekeningPt =
          data.bankRekeningPtId == null
            ? { disconnect: true }
            : { connect: { id: data.bankRekeningPtId } };
      }
      if (data.nilaiSudahDibayarkan !== undefined) {
        updateData.nilaiSudahDibayarkan =
          data.nilaiSudahDibayarkan == null
            ? null
            : new Prisma.Decimal(data.nilaiSudahDibayarkan);
      }
      if (data.sisaNilaiKontrak !== undefined) {
        updateData.sisaNilaiKontrak =
          data.sisaNilaiKontrak == null
            ? null
            : new Prisma.Decimal(data.sisaNilaiKontrak);
      }
      if (data.progressOverride !== undefined) {
        updateData.progressOverride =
          data.progressOverride == null
            ? null
            : new Prisma.Decimal(data.progressOverride);
      }
      if (data.notesPekerjaan !== undefined) {
        updateData.notesPekerjaan = data.notesPekerjaan;
      }
      if (data.jatuhTempo !== undefined) updateData.jatuhTempo = data.jatuhTempo;
      if (data.fileSpk !== undefined) updateData.fileSpk = data.fileSpk;
      if (data.mandorId !== undefined) {
        updateData.mandor = { connect: { id: mandorId } };
      }

      const result = await tx.spk.update({
        where: { id },
        data: updateData,
        include: SpkMapper.include,
      });

      await this.syncMandorOnProgressForKavlings(tx, kavlingIds, mandorId);

      return await this.withComputedProgress(SpkMapper.toDomain(result));
    });
  }

  private buildWhere(filters?: SpkFilterDTO): Prisma.SpkWhereInput {
    const where: Prisma.SpkWhereInput = {};

    if (filters?.mandorId) {
      where.mandorId = filters.mandorId;
    }

    const search = filters?.search?.trim();
    if (search) {
      where.OR = [
        { noSpk: { contains: search } },
        { judulPekerjaan: { contains: search } },
        { mandor: { username: { contains: search } } },
        {
          penjualanItems: {
            some: {
              kavling: {
                OR: [
                  { blok: { contains: search } },
                  { nomorUnit: { contains: search } },
                ],
              },
            },
          },
        },
      ];
    }

    return where;
  }

  private resolveOrderBy(
    orderBy?: SpkFilterDTO["orderBy"],
  ): Prisma.SpkOrderByWithRelationInput[] {
    if (orderBy === "mandor:asc") {
      return [{ mandor: { username: "asc" } }, { id: "desc" }];
    }
    if (orderBy === "mandor:desc") {
      return [{ mandor: { username: "desc" } }, { id: "desc" }];
    }
    return [{ id: "desc" }];
  }

  private async buildListSummary(
    where: Prisma.SpkWhereInput,
  ): Promise<SpkListSummary> {
    const [totalSpk, aggregates, totalKavling, progressSelesai] =
      await Promise.all([
        this.db.spk.count({ where }),
        this.db.spk.aggregate({
          where,
          _sum: {
            nilaiKontrak: true,
            nilaiSudahDibayarkan: true,
            sisaNilaiKontrak: true,
          },
        }),
        this.db.spkPenjualan.count({ where: { spk: where } }),
        this.db.spk.count({
          where: {
            AND: [where, { progressOverride: { gte: 100 } }],
          },
        }),
      ]);

    return {
      totalSpk,
      totalKavling,
      totalNilaiKontrak: Number(aggregates._sum.nilaiKontrak ?? 0),
      totalSudahDibayar: Number(aggregates._sum.nilaiSudahDibayarkan ?? 0),
      totalSisaNilai: Number(aggregates._sum.sisaNilaiKontrak ?? 0),
      progressSelesai,
    };
  }

  async findWithOffsetPagination(
    page: number,
    limit: number,
    filters?: SpkFilterDTO,
  ): Promise<OffsetPaginatedData<SpkEntity>> {
    const where = this.buildWhere(filters);
    const skip = (page - 1) * limit;

    const [totalItems, rows, summary] = await Promise.all([
      this.db.spk.count({ where }),
      this.db.spk.findMany({
        where,
        skip,
        take: limit,
        orderBy: this.resolveOrderBy(filters?.orderBy),
        include: SpkMapper.include,
      }),
      this.buildListSummary(where),
    ]);

    const totalPages = Math.ceil(totalItems / limit) || 1;

    return {
      items: await Promise.all(
        rows.map((item) => this.withComputedProgress(SpkMapper.toDomain(item))),
      ),
      meta: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        summary,
      },
    };
  }

  async findWithCursorPagination(
    limit: number,
    cursor?: number,
    filters?: SpkFilterDTO,
  ): Promise<CursorPaginatedData<SpkEntity>> {
    const where = this.buildWhere(filters);

    const items = await this.db.spk.findMany({
      take: limit + 1,
      ...(cursor && { skip: 1, cursor: { id: cursor } }),
      where,
      orderBy: [{ id: "desc" }],
      include: SpkMapper.include,
    });

    let hasNextPage = false;
    if (items.length > limit) {
      hasNextPage = true;
      items.pop();
    }

    return {
      items: await Promise.all(
        items.map((item) => this.withComputedProgress(SpkMapper.toDomain(item))),
      ),
      meta: {
        nextCursor: hasNextPage ? (items.at(-1)?.id ?? null) : null,
        hasNextPage,
      },
    };
  }

  async delete(id: number): Promise<void> {
    const existing = await this.findById(id);
    if (!existing) throw new NotFoundError("SPK tidak ditemukan");

    await this.db.$transaction(async (tx) => {
      const kavlingIds = existing.kavlingItems.map((p) => p.kavlingId);
      if (kavlingIds.length > 0) {
        await this.syncMandorOnProgressForKavlings(tx, kavlingIds, null);
      }
      await tx.spk.delete({ where: { id } });
    });
  }
}
