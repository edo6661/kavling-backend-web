import { NotarisPembayaranStatus, Prisma } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";
import type { INotarisPembayaranRepository } from "./INotarisPembayaranRepo.js";
import type {
  BayarNotarisPembayaranDTO,
  NotarisPembayaranFilterDTO,
  SetNotarisBsiCmsDilaporkanDTO,
} from "../dtos/NotarisPembayaranDTO.js";
import type { NotarisPembayaranEntity } from "../entities/NotarisPembayaran.js";
import type { OffsetPaginatedData } from "../../types/response.js";
import { NotarisPembayaranMapper } from "../../infrastructure/mapper/NotarisPembayaranMapper.js";
import { syncAllEligibleNotarisPembayaran } from "../notaris/notarisPembayaranSync.js";

export class NotarisPembayaranRepository implements INotarisPembayaranRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: number): Promise<NotarisPembayaranEntity | null> {
    const row = await this.db.notarisPembayaran.findUnique({
      where: { id },
      include: NotarisPembayaranMapper.include,
    });
    if (!row) return null;
    return NotarisPembayaranMapper.toDomain(row);
  }

  async markAsPaid(
    data: BayarNotarisPembayaranDTO,
  ): Promise<NotarisPembayaranEntity> {
    const result = await this.db.notarisPembayaran.update({
      where: { id: data.id },
      data: {
        status: NotarisPembayaranStatus.SUDAH_DIBAYAR,
        buktiPembayaran: data.buktiPembayaran,
        tanggalPembayaran: data.tanggalPembayaran ?? new Date(),
        dibayarOlehId: data.dibayarOlehId,
      },
      include: NotarisPembayaranMapper.include,
    });

    return NotarisPembayaranMapper.toDomain(result);
  }

  async findPaginated(
    page: number,
    limit: number,
    filters?: NotarisPembayaranFilterDTO,
  ): Promise<OffsetPaginatedData<NotarisPembayaranEntity>> {
    await syncAllEligibleNotarisPembayaran(this.db);

    const where: Prisma.NotarisPembayaranWhereInput = {};

    if (filters?.status) where.status = filters.status;
    if (filters?.penjualanId) where.penjualanId = filters.penjualanId;
    if (filters?.search) {
      where.OR = [
        { penjualan: { noTransaksi: { contains: filters.search } } },
        { penjualan: { customer: { nama: { contains: filters.search } } } },
        {
          penjualan: {
            detailKavlingPajak: {
              notaris: { nama: { contains: filters.search } },
            },
          },
        },
        {
          penjualan: {
            kavling: {
              OR: [
                { blok: { contains: filters.search } },
                { nomorUnit: { contains: filters.search } },
              ],
            },
          },
        },
      ];
    }

    const skip = (page - 1) * limit;
    const [totalItems, rows] = await Promise.all([
      this.db.notarisPembayaran.count({ where }),
      this.db.notarisPembayaran.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ penjualanId: "asc" }, { jenis: "asc" }],
        include: NotarisPembayaranMapper.include,
      }),
    ]);

    const totalPages = Math.ceil(totalItems / limit) || 1;

    return {
      items: rows.map((r) => NotarisPembayaranMapper.toDomain(r)),
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

  async setBsiCmsDilaporkan(
    data: SetNotarisBsiCmsDilaporkanDTO,
  ): Promise<NotarisPembayaranEntity[]> {
    const uniqueIds = [...new Set(data.ids)];
    if (uniqueIds.length === 0) return [];

    await this.db.notarisPembayaran.updateMany({
      where: { id: { in: uniqueIds } },
      data: {
        bsiCmsDilaporkan: data.dilaporkan,
        bsiCmsDilaporkanAt: data.dilaporkan ? new Date() : null,
      },
    });

    const rows = await this.db.notarisPembayaran.findMany({
      where: { id: { in: uniqueIds } },
      include: NotarisPembayaranMapper.include,
      orderBy: [{ id: "asc" }],
    });

    return rows.map((r) => NotarisPembayaranMapper.toDomain(r));
  }
}
