import { Prisma, Role } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";
import type { ISpkRepository } from "./ISpkRepo.js";
import type { CreateSpkDTO, SpkFilterDTO, UpdateSpkDTO } from "../dtos/SpkDTO.js";
import type { SpkEntity } from "../entities/Spk.js";
import type { CursorPaginatedData } from "../../types/response.js";
import { SpkMapper } from "../../infrastructure/mapper/SpkMapper.js";
import { NotFoundError } from "../errors/NotFoundError.js";
import { ConflictError } from "../errors/ConflictError.js";
import { AppError } from "../errors/AppError.js";
import { StatusCodes } from "http-status-codes";

export class SpkRepository implements ISpkRepository {
  constructor(private readonly db: PrismaClient) {}

  private async computeDefaultProgressByKavlingIds(
    kavlingIds: number[],
  ): Promise<number> {
    if (kavlingIds.length === 0) return 0;

    const rows = await this.db.progressProyek.findMany({
      where: {
        OR: [
          { kavlingId: { in: kavlingIds } },
          { penjualan: { kavlingId: { in: kavlingIds } } },
        ],
      },
      select: {
        persentase: true,
        persentaseOverride: true,
        kavlingId: true,
        penjualan: { select: { kavlingId: true } },
      },
    });

    const perKavling = new Map<number, number>();
    rows.forEach((r) => {
      const kid = r.kavlingId ?? r.penjualan?.kavlingId ?? null;
      if (!kid) return;
      if (perKavling.has(kid)) return;
      perKavling.set(
        kid,
        r.persentaseOverride != null
          ? Number(r.persentaseOverride)
          : Number(r.persentase),
      );
    });

    const values = kavlingIds.map((kid) => perKavling.get(kid) ?? 0);
    const avg = values.reduce((acc, v) => acc + v, 0) / values.length;
    return Math.min(100, Math.max(0, Number(avg.toFixed(2))));
  }

  private async withComputedProgress(entity: SpkEntity): Promise<SpkEntity> {
    const kavlingIds = entity.kavlingItems.map((k) => k.kavlingId);
    const defaultProgress = await this.computeDefaultProgressByKavlingIds(kavlingIds);
    const override = entity.progressOverride;
    const progress = override != null ? Math.min(100, Math.max(0, override)) : defaultProgress;

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
          kasbonSebelumTermin2:
            data.kasbonSebelumTermin2 != null
              ? new Prisma.Decimal(data.kasbonSebelumTermin2)
              : null,
          kasbonSebelumTermin3:
            data.kasbonSebelumTermin3 != null
              ? new Prisma.Decimal(data.kasbonSebelumTermin3)
              : null,
          kasbonSebelumTermin4:
            data.kasbonSebelumTermin4 != null
              ? new Prisma.Decimal(data.kasbonSebelumTermin4)
              : null,
          bankRekeningPtId: data.bankRekeningPtId ?? null,
          nilaiBisaDitagihkan: new Prisma.Decimal(
            data.nilaiBisaDitagihkan != null ? data.nilaiBisaDitagihkan : 0,
          ),
          nilaiSudahDibayarkan: new Prisma.Decimal(
            data.nilaiSudahDibayarkan != null ? data.nilaiSudahDibayarkan : 0,
          ),
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
      if (data.kasbonSebelumTermin2 !== undefined) {
        updateData.kasbonSebelumTermin2 =
          data.kasbonSebelumTermin2 == null
            ? null
            : new Prisma.Decimal(data.kasbonSebelumTermin2);
      }
      if (data.kasbonSebelumTermin3 !== undefined) {
        updateData.kasbonSebelumTermin3 =
          data.kasbonSebelumTermin3 == null
            ? null
            : new Prisma.Decimal(data.kasbonSebelumTermin3);
      }
      if (data.kasbonSebelumTermin4 !== undefined) {
        updateData.kasbonSebelumTermin4 =
          data.kasbonSebelumTermin4 == null
            ? null
            : new Prisma.Decimal(data.kasbonSebelumTermin4);
      }
      if (data.bankRekeningPtId !== undefined) {
        updateData.bankRekeningPt =
          data.bankRekeningPtId == null
            ? { disconnect: true }
            : { connect: { id: data.bankRekeningPtId } };
      }
      if (data.nilaiBisaDitagihkan !== undefined) {
        updateData.nilaiBisaDitagihkan =
          data.nilaiBisaDitagihkan == null
            ? null
            : new Prisma.Decimal(data.nilaiBisaDitagihkan);
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

  async findWithCursorPagination(
    limit: number,
    cursor?: number,
    filters?: SpkFilterDTO,
  ): Promise<CursorPaginatedData<SpkEntity>> {
    const where: Prisma.SpkWhereInput = {};

    if (filters?.mandorId) {
      where.mandorId = filters.mandorId;
    }

    if (filters?.search) {
      where.OR = [
        { noSpk: { contains: filters.search } },
        { judulPekerjaan: { contains: filters.search } },
        { mandor: { username: { contains: filters.search } } },
      ];
    }

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
