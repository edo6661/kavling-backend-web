import type { Prisma } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";
import type { ITagihanRepository } from "./ITagihanRepo.js";
import type {
  CreateTagihanDTO,
  UpdateTagihanDTO,
  TagihanFilterDTO,
  TagihanResponseDTO,
} from "../dtos/TagihanDTO.js";
import { NotFoundError } from "../errors/NotFoundError.js";
import { TagihanMapper } from "../../infrastructure/mapper/TagihanMapper.js";
import type { OffsetPaginatedData } from "../../types/response.js";

const tagihanIncludeRelations = {
  customer: { select: { nama: true } },
  penjualan: {
    include: {
      kavling: {
        include: {
          perumahan: { select: { nama: true } },
          rekeningTujuan: true,
        },
      },
      rekeningTujuan: true,
    },
  },
} satisfies Prisma.TagihanInclude;

export class TagihanRepository implements ITagihanRepository {
  constructor(private readonly db: PrismaClient) {}

  async count(): Promise<number> {
    return await this.db.tagihan.count();
  }

  async create(
    data: CreateTagihanDTO,
    noTagihan: string,
  ): Promise<TagihanResponseDTO> {
    const parseDate = (d: string | Date) => new Date(d);

    const result = await this.db.tagihan.create({
      data: {
        noTagihan,
        customerId: data.customerId,
        penjualanId: data.penjualanId,
        pembayaran: data.pembayaran,
        tujuan: data.tujuan ?? "LAINNYA",
        nominal: data.nominal,
        jatuhTempo: parseDate(data.jatuhTempo),
        reminderBerikutnya: data.reminderBerikutnya
          ? parseDate(data.reminderBerikutnya)
          : null,
        status: "BELUM_BAYAR",
      },
      include: tagihanIncludeRelations,
    });

    return TagihanMapper.toDomain(result);
  }

  async findById(id: number): Promise<TagihanResponseDTO | null> {
    const result = await this.db.tagihan.findUnique({
      where: { id },
      include: tagihanIncludeRelations,
    });
    if (!result) return null;
    return TagihanMapper.toDomain(result);
  }

  async update(
    id: number,
    data: UpdateTagihanDTO,
  ): Promise<TagihanResponseDTO> {
    const existing = await this.findById(id);
    if (!existing) throw new NotFoundError("Tagihan tidak ditemukan");

    const updateData: Prisma.TagihanUpdateInput = {};
    if (data.pembayaran !== undefined) updateData.pembayaran = data.pembayaran;
    if (data.tujuan !== undefined) updateData.tujuan = data.tujuan;
    if (data.nominal !== undefined) updateData.nominal = data.nominal;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.fileBukti !== undefined) updateData.fileBukti = data.fileBukti;
    if (data.jatuhTempo !== undefined)
      updateData.jatuhTempo = new Date(data.jatuhTempo);
    if (data.reminderBerikutnya !== undefined) {
      updateData.reminderBerikutnya = data.reminderBerikutnya
        ? new Date(data.reminderBerikutnya)
        : null;
    }

    const result = await this.db.tagihan.update({
      where: { id },
      data: updateData,
      include: tagihanIncludeRelations,
    });

    return TagihanMapper.toDomain(result);
  }

  async findWithOffsetPagination(
    page: number,
    limit: number,
    filters?: TagihanFilterDTO,
  ): Promise<OffsetPaginatedData<TagihanResponseDTO>> {
    const where: Prisma.TagihanWhereInput = {
      penjualan: {
        status: { not: "BATAL" },
      },
    };

    if (filters?.customerId) where.customerId = filters.customerId;
    if (filters?.penjualanId) where.penjualanId = filters.penjualanId;
    if (filters?.status) where.status = filters.status;

    if (filters?.search) {
      where.OR = [
        { noTagihan: { contains: filters.search } },
        { pembayaran: { contains: filters.search } },
        { customer: { nama: { contains: filters.search } } },
      ];
    }

    // Penambahan Filter Tanggal (Berdasarkan Update/Bayar)
    if (filters?.startDate || filters?.endDate) {
      where.updatedAt = {};
      if (filters.startDate) {
        const start = new Date(filters.startDate);
        start.setHours(0, 0, 0, 0);
        where.updatedAt.gte = start;
      }
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        where.updatedAt.lte = end;
      }
    }

    // Penambahan Dinamis Order By
    let orderByClause: Prisma.TagihanOrderByWithRelationInput[] = [
      { updatedAt: "desc" }, // Default Sort
    ];

    if (filters?.orderBy) {
      const { field, direction } = filters.orderBy;
      if (["createdAt", "updatedAt", "nominal"].includes(field)) {
        orderByClause = [{ [field]: direction }];
      }
    }

    const skip = (page - 1) * limit;

    const [items, totalItems] = await Promise.all([
      this.db.tagihan.findMany({
        take: limit,
        skip,
        where,
        orderBy: orderByClause,
        include: tagihanIncludeRelations,
      }),
      this.db.tagihan.count({ where }),
    ]);

    const totalPages = Math.ceil(totalItems / limit) || 1;

    return {
      items: items.map((item) => TagihanMapper.toDomain(item as any)),
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
  async delete(id: number): Promise<void> {
    const existing = await this.findById(id);
    if (!existing) throw new NotFoundError("Tagihan tidak ditemukan");
    await this.db.tagihan.delete({ where: { id } });
  }
  async findByNoTagihan(noTagihan: string): Promise<TagihanResponseDTO | null> {
    const result = await this.db.tagihan.findUnique({
      where: { noTagihan },
      include: tagihanIncludeRelations,
    });
    if (!result) return null;
    return TagihanMapper.toDomain(result);
  }
}
