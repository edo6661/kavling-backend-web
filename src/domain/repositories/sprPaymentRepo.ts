import type { Prisma } from "@prisma/client";
import type { PrismaClient, SprPayment } from "@prisma/client";
import type { ISprPaymentRepository } from "./ISprPaymentRepo.js";
import type {
  CreateSprPaymentDTO,
  UpdateSprPaymentDTO,
  SprPaymentFilterDTO,
} from "../dtos/SprPaymentDTO.js";
import type { CursorPaginatedData } from "../../types/response.js";
import { NotFoundError } from "../errors/NotFoundError.js";
import { ConflictError } from "../errors/ConflictError.js";

export class SprPaymentRepository implements ISprPaymentRepository {
  constructor(private readonly db: PrismaClient) {}

  async create(data: CreateSprPaymentDTO): Promise<SprPayment> {
    const sprExists = await this.db.spr.findUnique({
      where: { id: data.sprId },
    });
    if (!sprExists) throw new NotFoundError("Data SPR tidak ditemukan");

    return await this.db.sprPayment.create({
      data: {
        sprId: data.sprId,
        keterangan: data.keterangan,
        jatuhTempo: data.jatuhTempo,
        nilai: data.nilai,
        statusPembayaran: "BELUM_BAYAR",
      },
    });
  }

  async findById(id: number): Promise<SprPayment | null> {
    return await this.db.sprPayment.findUnique({ where: { id } });
  }

  async update(id: number, data: UpdateSprPaymentDTO): Promise<SprPayment> {
    const existing = await this.findById(id);
    if (!existing) throw new NotFoundError("Data pembayaran tidak ditemukan");

    const updateData: Prisma.SprPaymentUpdateInput = {};
    if (data.keterangan !== undefined) updateData.keterangan = data.keterangan;
    if (data.jatuhTempo !== undefined) updateData.jatuhTempo = data.jatuhTempo;
    if (data.nilai !== undefined) updateData.nilai = data.nilai;
    if (data.statusPembayaran !== undefined)
      updateData.statusPembayaran = data.statusPembayaran;
    if (data.buktiTransfer !== undefined)
      updateData.buktiTransfer = data.buktiTransfer ?? null;

    return await this.db.sprPayment.update({
      where: { id },
      data: updateData,
    });
  }
  async findWithCursorPagination(
    limit: number,
    cursor?: number,
    filters?: SprPaymentFilterDTO,
  ): Promise<CursorPaginatedData<SprPayment>> {
    const where: Prisma.SprPaymentWhereInput = {};

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    if (filters?.sprId) where.sprId = filters.sprId;
    if (filters?.statusPembayaran)
      where.statusPembayaran = filters.statusPembayaran;
    if (filters?.search) {
      where.keterangan = { contains: filters.search };
    }

    let orderByClause: Prisma.SprPaymentOrderByWithRelationInput[] = [
      { jatuhTempo: "asc" },
      { id: "asc" },
    ];

    if (filters?.orderBy) {
      const { field, direction } = filters.orderBy;
      const validFields = [
        "keterangan",
        "jatuhTempo",
        "nilai",
        "statusPembayaran",
        "createdAt",
      ];
      if (validFields.includes(field)) {
        orderByClause = [{ [field]: direction }, { id: "asc" }];
      }
    }

    const items = await this.db.sprPayment.findMany({
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
    if (!existing) throw new NotFoundError("Data pembayaran tidak ditemukan");

    if (existing.statusPembayaran === "LUNAS") {
      throw new ConflictError("Tidak dapat menghapus tagihan yang sudah lunas");
    }

    await this.db.sprPayment.delete({ where: { id } });
  }
}
