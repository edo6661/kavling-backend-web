import { BankKprPembayaranStatus, Prisma } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";
import type { IBankKprPembayaranRepository } from "./IBankKprPembayaranRepo.js";
import type {
  BayarBankKprPembayaranDTO,
  BankKprPembayaranFilterDTO,
  SetBankKprBsiCmsDilaporkanDTO,
} from "../dtos/BankKprPembayaranDTO.js";
import type { BankKprPembayaranEntity } from "../entities/BankKprPembayaran.js";
import type { OffsetPaginatedData } from "../../types/response.js";
import { BankKprPembayaranMapper } from "../../infrastructure/mapper/BankKprPembayaranMapper.js";
import { syncAllEligibleBankKprPembayaran } from "../kpr/bankKprPembayaranSync.js";

export class BankKprPembayaranRepository implements IBankKprPembayaranRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: number): Promise<BankKprPembayaranEntity | null> {
    const row = await this.db.bankKprPembayaran.findUnique({
      where: { id },
      include: BankKprPembayaranMapper.include,
    });
    if (!row) return null;
    return BankKprPembayaranMapper.toDomain(row);
  }

  async markAsPaid(
    data: BayarBankKprPembayaranDTO,
  ): Promise<BankKprPembayaranEntity> {
    const result = await this.db.bankKprPembayaran.update({
      where: { id: data.id },
      data: {
        status: BankKprPembayaranStatus.SUDAH_DIBAYAR,
        buktiPembayaran: data.buktiPembayaran,
        tanggalPembayaran: data.tanggalPembayaran ?? new Date(),
        dibayarOlehId: data.dibayarOlehId,
      },
      include: BankKprPembayaranMapper.include,
    });

    return BankKprPembayaranMapper.toDomain(result);
  }

  async syncAllEligible(): Promise<void> {
    await syncAllEligibleBankKprPembayaran(this.db);
  }

  async findPaginated(
    page: number,
    limit: number,
    filters?: BankKprPembayaranFilterDTO,
  ): Promise<OffsetPaginatedData<BankKprPembayaranEntity>> {
    const kprPenjualanFilter = { caraPembayaran: "KPR" as const };
    const where: Prisma.BankKprPembayaranWhereInput = {
      penjualan: kprPenjualanFilter,
    };

    if (filters?.status) where.status = filters.status;
    if (filters?.penjualanId) where.penjualanId = filters.penjualanId;
    if (filters?.search) {
      where.OR = [
        {
          penjualan: {
            ...kprPenjualanFilter,
            noTransaksi: { contains: filters.search },
          },
        },
        {
          penjualan: {
            ...kprPenjualanFilter,
            customer: { nama: { contains: filters.search } },
          },
        },
        {
          penjualan: {
            ...kprPenjualanFilter,
            bank: { contains: filters.search },
          },
        },
        {
          penjualan: {
            ...kprPenjualanFilter,
            bankKprNamaRekening: { contains: filters.search },
          },
        },
        {
          penjualan: {
            ...kprPenjualanFilter,
            kavling: {
              OR: [
                { blok: { contains: filters.search } },
                { nomorUnit: { contains: filters.search } },
              ],
            },
          },
        },
      ];
      delete where.penjualan;
    }

    const skip = (page - 1) * limit;
    const [totalItems, rows] = await Promise.all([
      this.db.bankKprPembayaran.count({ where }),
      this.db.bankKprPembayaran.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ penjualanId: "asc" }, { jenis: "asc" }],
        include: BankKprPembayaranMapper.include,
      }),
    ]);

    const totalPages = Math.ceil(totalItems / limit) || 1;

    return {
      items: rows.map((r) => BankKprPembayaranMapper.toDomain(r)),
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
    data: SetBankKprBsiCmsDilaporkanDTO,
  ): Promise<BankKprPembayaranEntity[]> {
    const uniqueIds = [...new Set(data.ids)];
    if (uniqueIds.length === 0) return [];

    await this.db.bankKprPembayaran.updateMany({
      where: { id: { in: uniqueIds } },
      data: {
        bsiCmsDilaporkan: data.dilaporkan,
        bsiCmsDilaporkanAt: data.dilaporkan ? new Date() : null,
      },
    });

    const rows = await this.db.bankKprPembayaran.findMany({
      where: { id: { in: uniqueIds } },
      include: BankKprPembayaranMapper.include,
      orderBy: [{ id: "asc" }],
    });

    return rows.map((r) => BankKprPembayaranMapper.toDomain(r));
  }
}
