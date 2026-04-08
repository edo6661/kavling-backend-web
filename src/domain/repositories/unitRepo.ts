import { Prisma } from "@prisma/client";
import type { PrismaClient, Unit } from "@prisma/client";
import type { IUnitRepository } from "./IUnitRepo.js";
import type {
  CreateUnitDTO,
  UpdateUnitDTO,
  UnitFilterDTO,
} from "../dtos/UnitDTO.js";
import type { CursorPaginatedData } from "../../types/response.js";
import { NotFoundError } from "../errors/NotFoundError.js";
import { ConflictError } from "../errors/ConflictError.js";
import { UnitMapper } from "../../infrastructure/mapper/UnitMapper.js";

export class UnitRepository implements IUnitRepository {
  constructor(private readonly db: PrismaClient) {}

  async create(data: CreateUnitDTO): Promise<Unit> {
    const existingUnit = await this.findByBlok(
      data.namaPerumahan,
      data.blok,
      data.nomorUnit,
    );
    if (existingUnit) {
      throw new ConflictError(
        "Nomor unit di blok perumahan ini sudah terdaftar",
      );
    }

    const createData: Prisma.UnitCreateInput = {
      namaPerumahan: data.namaPerumahan,
      blok: data.blok,
      nomorUnit: data.nomorUnit,
      tipe: data.tipe ?? null,
      luasTanah: data.luasTanah ?? null,
      luasBangunan: data.luasBangunan ?? null,
      lantai: data.lantai ?? null,
      lokasiStrategis: data.lokasiStrategis ?? null,
    };

    if (data.status !== undefined) {
      createData.status = data.status;
    }

    const result = await this.db.unit.create({
      data: createData,
    });
    return UnitMapper.toDomain(result);
  }

  async findById(id: number): Promise<Unit | null> {
    return await this.db.unit.findUnique({ where: { id } });
  }

  async findByBlok(
    namaPerumahan: string,
    blok: string,
    nomorUnit: string,
  ): Promise<Unit | null> {
    return await this.db.unit.findFirst({
      where: {
        namaPerumahan,
        blok,
        nomorUnit,
      },
    });
  }

  async update(id: number, data: UpdateUnitDTO): Promise<Unit> {
    const existing = await this.findById(id);
    if (!existing) throw new NotFoundError("Unit tidak ditemukan");

    if (data.blok || data.nomorUnit || data.namaPerumahan) {
      const perumahanBaru = data.namaPerumahan ?? existing.namaPerumahan;
      const blokBaru = data.blok ?? existing.blok;
      const nomorUnitBaru = data.nomorUnit ?? existing.nomorUnit;

      const checkDuplicate = await this.findByBlok(
        perumahanBaru,
        blokBaru,
        nomorUnitBaru,
      );
      if (checkDuplicate && checkDuplicate.id !== id) {
        throw new ConflictError(
          "Nomor unit di blok perumahan ini sudah terdaftar",
        );
      }
    }

    const updateData: Prisma.UnitUpdateInput = {};
    if (data.namaPerumahan !== undefined)
      updateData.namaPerumahan = data.namaPerumahan;
    if (data.blok !== undefined) updateData.blok = data.blok;
    if (data.nomorUnit !== undefined) updateData.nomorUnit = data.nomorUnit;
    if (data.tipe !== undefined) updateData.tipe = data.tipe ?? null;
    if (data.luasTanah !== undefined)
      updateData.luasTanah = data.luasTanah ?? null;
    if (data.luasBangunan !== undefined)
      updateData.luasBangunan = data.luasBangunan ?? null;
    if (data.lantai !== undefined) updateData.lantai = data.lantai ?? null;
    if (data.lokasiStrategis !== undefined)
      updateData.lokasiStrategis = data.lokasiStrategis ?? null;
    if (data.status !== undefined) updateData.status = data.status;

    return await this.db.unit.update({
      where: { id },
      data: updateData,
    });
  }
  async findWithCursorPagination(
    limit: number,
    cursor?: number,
    filters?: UnitFilterDTO,
  ): Promise<CursorPaginatedData<Unit>> {
    const where: Prisma.UnitWhereInput = {};

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    if (filters?.search) {
      where.OR = [
        { namaPerumahan: { contains: filters.search } },
        { blok: { contains: filters.search } },
        { nomorUnit: { contains: filters.search } },
      ];
    }
    if (filters?.status) {
      where.status = filters.status;
    }

    let orderByClause: Prisma.UnitOrderByWithRelationInput[] = [
      { createdAt: "desc" },
      { id: "asc" },
    ];

    if (filters?.orderBy) {
      const { field, direction } = filters.orderBy;
      const validFields = [
        "namaPerumahan",
        "blok",
        "nomorUnit",
        "status",
        "createdAt",
      ];
      if (validFields.includes(field)) {
        orderByClause = [{ [field]: direction }, { id: "asc" }];
      }
    }

    const items = await this.db.unit.findMany({
      take: limit + 1,
      ...(cursor && { skip: 1, cursor: { id: cursor } }),
      where,
      orderBy: orderByClause,
    });

    let hasNextPage = false;
    if (items.length > limit) {
      hasNextPage = true;
      items.pop();
    }

    const nextCursor = hasNextPage ? (items.at(-1)?.id ?? null) : null;

    return { items, meta: { nextCursor, hasNextPage } };
  }
  async delete(id: number): Promise<void> {
    const existing = await this.findById(id);
    if (!existing) throw new NotFoundError("Unit tidak ditemukan");

    try {
      await this.db.unit.delete({ where: { id } });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2003"
      ) {
        throw new ConflictError(
          "Unit tidak dapat dihapus karena sudah terhubung dengan data Surat Pesanan Rumah (SPR).",
        );
      }
      throw error;
    }
  }
}
