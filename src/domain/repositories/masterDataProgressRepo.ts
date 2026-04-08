import type { Prisma } from "@prisma/client";
import type { PrismaClient, MasterDataProgress } from "@prisma/client";
import type { IMasterDataProgressRepository } from "./IMasterDataProgressRepo.js";
import type {
  CreateMasterDataProgressDTO,
  UpdateMasterDataProgressDTO,
  MasterDataProgressFilterDTO,
} from "../dtos/MasterDataProgressDTO.js";
import type { CursorPaginatedData } from "../../types/response.js";
import { NotFoundError } from "../errors/NotFoundError.js";
import { ConflictError } from "../errors/ConflictError.js";

export class MasterDataProgressRepository implements IMasterDataProgressRepository {
  constructor(private readonly db: PrismaClient) {}

  async create(data: CreateMasterDataProgressDTO): Promise<MasterDataProgress> {
    const existing = await this.db.masterDataProgress.findUnique({
      where: { sprId: data.sprId },
    });
    if (existing) {
      throw new ConflictError("Data progress untuk SPR ini sudah ada.");
    }

    const sprExists = await this.db.spr.findUnique({
      where: { id: data.sprId },
    });
    if (!sprExists) {
      throw new NotFoundError("Data SPR tidak ditemukan.");
    }

    return await this.db.masterDataProgress.create({
      data: { sprId: data.sprId },
      include: { spr: { include: { unit: true } } },
    });
  }

  async findById(id: number): Promise<MasterDataProgress | null> {
    return await this.db.masterDataProgress.findUnique({
      where: { id },
      include: { spr: { include: { unit: true } } },
    });
  }

  async findBySprId(sprId: number): Promise<MasterDataProgress | null> {
    return await this.db.masterDataProgress.findUnique({
      where: { sprId },
      include: { spr: { include: { unit: true } } },
    });
  }

  async update(
    id: number,
    data: UpdateMasterDataProgressDTO,
  ): Promise<MasterDataProgress> {
    const existing = await this.db.masterDataProgress.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundError("Data progress tidak ditemukan");

    const updateData = Object.entries(data).reduce(
      (acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      },
      {} as Record<string, any>,
    );

    return await this.db.masterDataProgress.update({
      where: { id },
      data: updateData,
      include: { spr: { include: { unit: true } } },
    });
  }

  async findWithCursorPagination(
    limit: number,
    cursor?: number,
    filters?: MasterDataProgressFilterDTO,
  ): Promise<CursorPaginatedData<MasterDataProgress>> {
    const where: Prisma.MasterDataProgressWhereInput = {};

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    if (filters?.sprId) where.sprId = filters.sprId;
    if (filters?.statusAkadPpjb) where.statusAkadPpjb = filters.statusAkadPpjb;

    let orderByClause: Prisma.MasterDataProgressOrderByWithRelationInput[] = [
      { id: "desc" },
    ];

    if (filters?.orderBy) {
      const { field, direction } = filters.orderBy;
      const validFields = ["statusAkadPpjb", "createdAt", "tanggalAkadPpjb"];
      if (validFields.includes(field)) {
        orderByClause = [{ [field]: direction }, { id: "asc" }];
      }
    }

    const items = await this.db.masterDataProgress.findMany({
      take: limit + 1,
      ...(cursor && { skip: 1, cursor: { id: cursor } }),
      where,
      orderBy: orderByClause,
      include: { spr: { include: { unit: true } } },
    });

    let hasNextPage = false;
    if (items.length > limit) {
      hasNextPage = true;
      items.pop();
    }

    const nextCursor = hasNextPage ? (items.at(-1)?.id ?? null) : null;

    return { items, meta: { nextCursor, hasNextPage } };
  }
}
