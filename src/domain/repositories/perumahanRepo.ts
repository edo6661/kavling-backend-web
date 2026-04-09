import { Prisma } from "@prisma/client";
import type { PrismaClient, Perumahan } from "@prisma/client";
import type { IPerumahanRepository } from "./IPerumahanRepo.js";
import type {
  CreatePerumahanDTO,
  UpdatePerumahanDTO,
  PerumahanFilterDTO,
} from "../dtos/PerumahanDTO.js";
import type { CursorPaginatedData } from "../../types/response.js";
import { NotFoundError } from "../errors/NotFoundError.js";
import { ConflictError } from "../errors/ConflictError.js";

export class PerumahanRepository implements IPerumahanRepository {
  constructor(private readonly db: PrismaClient) {}

  async create(data: CreatePerumahanDTO): Promise<Perumahan> {
    try {
      return await this.db.perumahan.create({ data });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictError(
          "Nama, Logo, atau Alamat Perumahan sudah terdaftar",
        );
      }
      throw error;
    }
  }

  async findById(id: number): Promise<Perumahan | null> {
    return await this.db.perumahan.findUnique({ where: { id } });
  }

  async update(id: number, data: UpdatePerumahanDTO): Promise<Perumahan> {
    const existing = await this.findById(id);
    if (!existing) throw new NotFoundError("Perumahan tidak ditemukan");

    try {
      const updateData: Prisma.PerumahanUncheckedUpdateInput = {};
      if (data.nama !== undefined) updateData.nama = data.nama;
      if (data.logo !== undefined) updateData.logo = data.logo;
      if (data.alamat !== undefined) updateData.alamat = data.alamat;

      return await this.db.perumahan.update({
        where: { id },
        data: updateData,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictError(
          "Nama, Logo, atau Alamat Perumahan sudah digunakan",
        );
      }
      throw error;
    }
  }

  async findWithCursorPagination(
    limit: number,
    cursor?: number,
    filters?: PerumahanFilterDTO,
  ): Promise<CursorPaginatedData<Perumahan>> {
    const where: Prisma.PerumahanWhereInput = {};

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    if (filters?.search) {
      where.OR = [
        { nama: { contains: filters.search } },
        { alamat: { contains: filters.search } },
      ];
    }

    let orderByClause: Prisma.PerumahanOrderByWithRelationInput[] = [
      { createdAt: "desc" },
      { id: "asc" },
    ];

    if (filters?.orderBy) {
      const { field, direction } = filters.orderBy;
      const validFields = ["nama", "alamat", "createdAt"];
      if (validFields.includes(field)) {
        orderByClause = [{ [field]: direction }, { id: "asc" }];
      }
    }

    const items = await this.db.perumahan.findMany({
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

    return {
      items,
      meta: { nextCursor, hasNextPage },
    };
  }

  async delete(id: number): Promise<void> {
    const existing = await this.findById(id);
    if (!existing) throw new NotFoundError("Perumahan tidak ditemukan");

    try {
      await this.db.perumahan.delete({ where: { id } });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2003"
      ) {
        throw new ConflictError(
          "Perumahan tidak dapat dihapus karena sudah terhubung dengan data Kavling atau Rekening PT.",
        );
      }
      throw error;
    }
  }
}
