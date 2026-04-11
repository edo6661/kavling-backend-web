import type { Prisma } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";
import type { ITagihanRepository } from "./ITagihanRepo.js";
import type {
  CreateTagihanDTO,
  UpdateTagihanDTO,
  TagihanFilterDTO,
  TagihanResponseDTO,
} from "../dtos/TagihanDTO.js";
import type { CursorPaginatedData } from "../../types/response.js";
import { NotFoundError } from "../errors/NotFoundError.js";
import { TagihanMapper } from "../../infrastructure/mapper/TagihanMapper.js";

const tagihanIncludeRelations = {
  customer: { select: { nama: true } },
  penjualan: {
    include: {
      kavling: {
        include: { perumahan: { select: { nama: true } } },
      },
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

  async findWithCursorPagination(
    limit: number,
    cursor?: number,
    filters?: TagihanFilterDTO,
  ): Promise<CursorPaginatedData<TagihanResponseDTO>> {
    const where: Prisma.TagihanWhereInput = {};

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

    const items = await this.db.tagihan.findMany({
      take: limit + 1,
      ...(cursor && { skip: 1, cursor: { id: cursor } }),
      where,
      orderBy: [{ createdAt: "desc" }],
      include: tagihanIncludeRelations,
    });

    let hasNextPage = false;
    if (items.length > limit) {
      hasNextPage = true;
      items.pop();
    }

    return {
      items: items.map((item) => TagihanMapper.toDomain(item as any)),
      meta: {
        nextCursor: hasNextPage ? (items.at(-1)?.id ?? null) : null,
        hasNextPage,
      },
    };
  }

  async delete(id: number): Promise<void> {
    const existing = await this.findById(id);
    if (!existing) throw new NotFoundError("Tagihan tidak ditemukan");
    await this.db.tagihan.delete({ where: { id } });
  }
}
