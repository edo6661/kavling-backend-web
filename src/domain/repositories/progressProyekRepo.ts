import type { PrismaClient } from "@prisma/client";
import { Prisma } from "@prisma/client";
import type { Prisma as PrismaTypes } from "@prisma/client";
import type {
  CreateProgressProyekByKavlingDTO,
  CreateProgressProyekDTO,
  ProgressProyekListFilterDTO,
  ProgressProyekListItemDTO,
  UpdateProgressProyekDTO,
} from "../dtos/ProgressProyekDTO.js";
import type { ProgressProyekEntity } from "../entities/ProgressProyek.js";
import {
  ProgressProyekMapper,
  type ProgressProyekWithRelations,
} from "../../infrastructure/mapper/ProgressProyekMapper.js";
import { NotFoundError } from "../errors/NotFoundError.js";
import { ConflictError } from "../errors/ConflictError.js";
import type { IProgressProyekRepository } from "./IProgressProyekRepo.js";
import type { OffsetPaginatedData } from "../../types/response.js";
import { penjualanKavlingWithSpkInclude } from "./IPenjualanRepo.js";
import { compareProgressProyekList } from "../../utils/kavlingSort.js";
import { calculateTotalProgressFromTahapan } from "../../utils/progressProyekCalc.js";

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

/** Client Prisma biasa atau dalam transaksi — untuk query read/write progress */
type ProgressDbClient = PrismaClient | Prisma.TransactionClient;

export class ProgressProyekRepository implements IProgressProyekRepository {
  constructor(private readonly db: PrismaClient) {}

  private resolveProgressProyekSummary(
    progressProyek: PenjualanListRow["progressProyek"],
    spkItem: PenjualanListRow["kavling"]["spkItem"],
  ): ProgressProyekSummary | null {
    if (progressProyek) {
      const override = progressProyek.persentaseOverride;
      const spk = spkItem?.spk;
      const mandorId = progressProyek.mandorId ?? spk?.mandorId ?? null;
      const mandor = progressProyek.mandor ?? spk?.mandor ?? null;
      return {
        persentase:
          override != null ? Number(override) : Number(progressProyek.persentase),
        persentaseIsOverride: override != null,
        mandorId,
        mandor,
      };
    }

    const spk = spkItem?.spk;
    if (!spk) return null;

    return {
      persentase: 0,
      persentaseIsOverride: false,
      mandorId: spk.mandorId,
      mandor: spk.mandor,
    };
  }

  private matchesProyekListSearch(
    item: ProgressProyekListItemDTO,
    noSpk: string | null,
    search: string,
  ): boolean {
    const term = search.trim().toLowerCase();
    if (!term) return true;

    const candidates = [
      item.nama !== "-" ? item.nama : null,
      item.blok,
      item.nomorUnit,
      `${item.blok}-${item.nomorUnit}`,
      item.progressProyek?.mandor?.username,
      noSpk,
    ];

    return candidates
      .filter((value): value is string => !!value)
      .some((value) => value.toLowerCase().includes(term));
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
    };

    if (filters?.mandorUserId) {
      kavlingWhere.OR = [
        { spkItem: { is: { spk: { mandorId: filters.mandorUserId } } } },
        { progressProyek: { mandorId: filters.mandorUserId } },
      ];
    }

    const kavlingOnlyRows = await this.db.kavling.findMany({
      where: kavlingWhere,
      include: {
        spkItem: penjualanKavlingWithSpkInclude.spkItem,
        progressProyek: {
          include: { mandor: { select: { id: true, username: true } } },
        },
      },
    });

    const penjualanItems = penjualanRows.map((item) => {
      const progressProyek = this.resolveProgressProyekSummary(
        item.progressProyek,
        item.kavling.spkItem,
      );

      return {
        item: {
          kavlingId: item.kavling.id,
          penjualanId: item.id,
          penjualanNoTransaksi: item.noTransaksi,
          blok: item.kavling.blok,
          nomorUnit: item.kavling.nomorUnit,
          nama: item.customer.nama,
          status: item.status,
          progressProyek,
        },
        noSpk: item.kavling.spkItem?.spk?.noSpk ?? null,
      };
    });

    const kavlingOnlyItems = kavlingOnlyRows.map((k) => {
      const progressProyek = this.resolveProgressProyekSummary(
        k.progressProyek,
        k.spkItem,
      );

      return {
        item: {
          kavlingId: k.id,
          penjualanId: null,
          penjualanNoTransaksi: null,
          blok: k.blok,
          nomorUnit: k.nomorUnit,
          nama: "-",
          status: "BELUM_TERJUAL",
          progressProyek,
        },
        noSpk: k.spkItem?.spk?.noSpk ?? null,
      };
    });

    const search = filters?.search?.trim();
    const mergedRows = [...penjualanItems, ...kavlingOnlyItems];
    const filteredRows = search
      ? mergedRows.filter((row) =>
          this.matchesProyekListSearch(row.item, row.noSpk, search),
        )
      : mergedRows;

    const allItems = filteredRows.map((row) => row.item).sort((a, b) => {
      const sortField = filters?.orderBy?.field;
      const sortDirection = filters?.orderBy?.direction ?? "desc";

      if (sortField === "progress") {
        const progressA = a.progressProyek?.persentase ?? 0;
        const progressB = b.progressProyek?.persentase ?? 0;
        if (progressA !== progressB) {
          return sortDirection === "desc"
            ? progressB - progressA
            : progressA - progressB;
        }
      }

      return compareProgressProyekList(
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
      );
    });

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

  private async getSpkMandorForKavling(kavlingId: number) {
    const link = await this.db.spkPenjualan.findUnique({
      where: { kavlingId },
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

  private async getSpkMandorForPenjualan(penjualanId: number) {
    const penjualan = await this.db.penjualan.findUnique({
      where: { id: penjualanId },
      select: { kavlingId: true },
    });
    if (!penjualan) return null;

    return this.getSpkMandorForKavling(penjualan.kavlingId);
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

  async createByKavlingId(
    data: CreateProgressProyekByKavlingDTO,
  ): Promise<ProgressProyekEntity> {
    const existing = await this.findByKavlingId(data.kavlingId);
    if (existing) {
      throw new ConflictError("Progress Proyek untuk kavling ini sudah ada.");
    }

    let mandorId = data.mandorId ?? null;
    if (mandorId === null) {
      const spkMandor = await this.getSpkMandorForKavling(data.kavlingId);
      mandorId = spkMandor?.mandorId ?? null;
    }

    const result = await this.db.progressProyek.create({
      data: {
        kavlingId: data.kavlingId,
        mandorId,
        persentase: 0,
      },
      include: ProgressProyekMapper.include,
    });

    return ProgressProyekMapper.toDomain(result);
  }

  async findSpkMandorIdByPenjualanId(penjualanId: number): Promise<number | null> {
    const spkMandor = await this.getSpkMandorForPenjualan(penjualanId);
    return spkMandor?.mandorId ?? null;
  }

  async findSpkMandorIdByKavlingId(kavlingId: number): Promise<number | null> {
    const spkMandor = await this.getSpkMandorForKavling(kavlingId);
    return spkMandor?.mandorId ?? null;
  }

  async findByPenjualanId(
    penjualanId: number,
  ): Promise<ProgressProyekEntity | null> {
    const result = await this.db.progressProyek.findUnique({
      where: { penjualanId },
      include: ProgressProyekMapper.include,
    });

    if (result) {
      const entity = ProgressProyekMapper.toDomain(result);
      const spkMandor = await this.getSpkMandorForPenjualan(penjualanId);
      return this.applySpkMandorFallback(entity, spkMandor);
    }

    const penjualan = await this.db.penjualan.findUnique({
      where: { id: penjualanId },
      select: { kavlingId: true },
    });
    if (!penjualan) return null;

    return this.findByKavlingId(penjualan.kavlingId);
  }

  async findByKavlingId(kavlingId: number): Promise<ProgressProyekEntity | null> {
    const result = await this.findProgressRowForKavling(this.db, kavlingId);
    if (!result) return null;

    const entity = ProgressProyekMapper.toDomain(result);
    const spkMandor = await this.getSpkMandorForKavling(kavlingId);
    return this.applySpkMandorFallback(entity, spkMandor);
  }

  async attachKavlingProgressToPenjualan(
    kavlingId: number,
    penjualanId: number,
  ): Promise<void> {
    const kavlingProgress = await this.db.progressProyek.findUnique({
      where: { kavlingId },
    });
    if (!kavlingProgress) return;

    const penjualanProgress = await this.db.progressProyek.findUnique({
      where: { penjualanId },
    });

    if (penjualanProgress && penjualanProgress.id !== kavlingProgress.id) {
      return;
    }

    await this.db.progressProyek.update({
      where: { id: kavlingProgress.id },
      data: { penjualanId, kavlingId: null },
    });
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

        await this.recalculatePersentase(tx, existing.id);
      }

      const finalResult = await tx.progressProyek.findUniqueOrThrow({
        where: { id: existing.id },
        include: ProgressProyekMapper.include,
      });

      return ProgressProyekMapper.toDomain(finalResult);
    });
  }

  async updateByKavlingId(
    kavlingId: number,
    data: UpdateProgressProyekDTO,
  ): Promise<ProgressProyekEntity> {
    const existing = await this.findByKavlingId(kavlingId);
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

        await this.recalculatePersentase(tx, existing.id);
      }

      const finalResult = await tx.progressProyek.findUniqueOrThrow({
        where: { id: existing.id },
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

      await this.recalculatePersentase(tx, progress.id);

      const updated = await tx.progressProyek.findUniqueOrThrow({
        where: { id: progress.id },
        include: ProgressProyekMapper.include,
      });

      return ProgressProyekMapper.toDomain(updated);
    });
  }

  async addTahapanLogByKavlingId(
    kavlingId: number,
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
      let progress = await this.findProgressRowForKavling(tx, kavlingId);

      if (!progress) {
        const spkMandor = await this.getSpkMandorForKavling(kavlingId);
        const penjualan = await tx.penjualan.findFirst({
          where: { kavlingId, status: { not: "BATAL" } },
          orderBy: { id: "desc" },
          select: { id: true },
        });

        progress = await tx.progressProyek.create({
          data: penjualan
            ? {
                penjualanId: penjualan.id,
                mandorId: spkMandor?.mandorId ?? null,
              }
            : {
                kavlingId,
                mandorId: spkMandor?.mandorId ?? null,
              },
          include: ProgressProyekMapper.include,
        });
      }

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

      await this.recalculatePersentase(tx, progress.id);

      const updated = await tx.progressProyek.findUniqueOrThrow({
        where: { id: progress.id },
        include: ProgressProyekMapper.include,
      });

      return ProgressProyekMapper.toDomain(updated);
    });
  }

  private pickPreferredProgressRow(
    byKavling: ProgressProyekWithRelations,
    byPenjualan: ProgressProyekWithRelations,
  ) {
    const kavlingTahapanCount = byKavling.tahapan.length;
    const penjualanTahapanCount = byPenjualan.tahapan.length;

    if (penjualanTahapanCount > 0 && kavlingTahapanCount === 0) {
      return byPenjualan;
    }
    if (kavlingTahapanCount > 0 && penjualanTahapanCount === 0) {
      return byKavling;
    }

    return byPenjualan;
  }

  private async findProgressRowForKavling(
    db: ProgressDbClient,
    kavlingId: number,
  ) {
    const byKavling = await db.progressProyek.findUnique({
      where: { kavlingId },
      include: ProgressProyekMapper.include,
    });

    const penjualan = await db.penjualan.findFirst({
      where: { kavlingId, status: { not: "BATAL" } },
      orderBy: { id: "desc" },
      select: { id: true },
    });

    const byPenjualan = penjualan
      ? await db.progressProyek.findUnique({
          where: { penjualanId: penjualan.id },
          include: ProgressProyekMapper.include,
        })
      : null;

    if (!byKavling && !byPenjualan) return null;
    if (!byKavling) return byPenjualan;
    if (!byPenjualan) return byKavling;

    return this.pickPreferredProgressRow(byKavling, byPenjualan);
  }

  private async recalculatePersentase(
    tx: Prisma.TransactionClient,
    progressId: number,
  ) {
    const current = await tx.progressProyek.findUnique({
      where: { id: progressId },
      select: { persentaseOverride: true },
    });
    if (current?.persentaseOverride != null) return;

    const allTahapan = await tx.tahapanProyek.findMany({
      where: { progressProyekId: progressId },
      orderBy: [{ tanggal: "desc" }, { id: "desc" }],
    });

    const finalTotal = calculateTotalProgressFromTahapan(allTahapan);

    await tx.progressProyek.update({
      where: { id: progressId },
      data: { persentase: new Prisma.Decimal(finalTotal.toFixed(2)) },
    });
  }

  async setTotalPersentaseByKavlingId(
    kavlingId: number,
    persentase: number,
  ): Promise<ProgressProyekEntity> {
    const normalized = Math.min(100, Math.max(0, persentase));
    const decimal = new Prisma.Decimal(normalized.toFixed(2));

    const spkMandor = await this.getSpkMandorForKavling(kavlingId);

    return await this.db.$transaction(async (tx) => {
      let progress = await this.findProgressRowForKavling(tx, kavlingId);

      if (!progress) {
        const penjualan = await tx.penjualan.findFirst({
          where: { kavlingId, status: { not: "BATAL" } },
          orderBy: { id: "desc" },
          select: { id: true },
        });

        progress = await tx.progressProyek.create({
          data: penjualan
            ? {
                penjualanId: penjualan.id,
                mandorId: spkMandor?.mandorId ?? null,
                persentase: decimal,
                persentaseOverride: decimal,
              }
            : {
                kavlingId,
                mandorId: spkMandor?.mandorId ?? null,
                persentase: decimal,
                persentaseOverride: decimal,
              },
          include: ProgressProyekMapper.include,
        });
      } else {
        progress = await tx.progressProyek.update({
          where: { id: progress.id },
          data: {
            persentase: decimal,
            persentaseOverride: decimal,
          },
          include: ProgressProyekMapper.include,
        });
      }

      return ProgressProyekMapper.toDomain(progress);
    });
  }

  async resetTotalPersentaseByKavlingId(
    kavlingId: number,
  ): Promise<ProgressProyekEntity> {
    const spkMandor = await this.getSpkMandorForKavling(kavlingId);

    return await this.db.$transaction(async (tx) => {
      let progress = await this.findProgressRowForKavling(tx, kavlingId);

      if (!progress) {
        const penjualan = await tx.penjualan.findFirst({
          where: { kavlingId, status: { not: "BATAL" } },
          orderBy: { id: "desc" },
          select: { id: true },
        });

        progress = await tx.progressProyek.create({
          data: penjualan
            ? {
                penjualanId: penjualan.id,
                mandorId: spkMandor?.mandorId ?? null,
                persentase: new Prisma.Decimal("0.00"),
              }
            : {
                kavlingId,
                mandorId: spkMandor?.mandorId ?? null,
                persentase: new Prisma.Decimal("0.00"),
              },
          include: ProgressProyekMapper.include,
        });
      } else {
        await tx.progressProyek.update({
          where: { id: progress.id },
          data: { persentaseOverride: null },
        });
      }

      await this.recalculatePersentase(tx, progress.id);

      const updated = await tx.progressProyek.findUniqueOrThrow({
        where: { id: progress.id },
        include: ProgressProyekMapper.include,
      });

      return ProgressProyekMapper.toDomain(updated);
    });
  }
}
