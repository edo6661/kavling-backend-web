import { AgentPencairanStatus, Prisma } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";
import type { IAgentPencairanRepository } from "./IAgentPencairanRepo.js";
import type {
  AgentPencairanFilterDTO,
  BayarAgentPencairanDTO,
  PersistAgentPencairanDTO,
  SetAgentBsiCmsDilaporkanDTO,
} from "../dtos/AgentPencairanDTO.js";
import type { AgentPencairanEntity, AgentPencairanTahap } from "../entities/AgentPencairan.js";
import type { OffsetPaginatedData } from "../../types/response.js";
import { AgentPencairanMapper } from "../../infrastructure/mapper/AgentPencairanMapper.js";

export class AgentPencairanRepository implements IAgentPencairanRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: number): Promise<AgentPencairanEntity | null> {
    const row = await this.db.agentPencairan.findUnique({
      where: { id },
      include: AgentPencairanMapper.include,
    });
    if (!row) return null;
    return AgentPencairanMapper.toDomain(row);
  }

  async findByFeeAgentId(feeAgentId: number): Promise<AgentPencairanEntity[]> {
    const rows = await this.db.agentPencairan.findMany({
      where: { feeAgentId },
      include: AgentPencairanMapper.include,
      orderBy: [{ tahap: "asc" }],
    });
    return rows.map((r) => AgentPencairanMapper.toDomain(r));
  }

  async findByFeeAgentIdAndTahap(
    feeAgentId: number,
    tahap: AgentPencairanTahap,
  ): Promise<AgentPencairanEntity | null> {
    const row = await this.db.agentPencairan.findUnique({
      where: { feeAgentId_tahap: { feeAgentId, tahap } },
      include: AgentPencairanMapper.include,
    });
    if (!row) return null;
    return AgentPencairanMapper.toDomain(row);
  }

  async findPaginated(
    page: number,
    limit: number,
    filters?: AgentPencairanFilterDTO,
  ): Promise<OffsetPaginatedData<AgentPencairanEntity>> {
    const where: Prisma.AgentPencairanWhereInput = {};

    if (filters?.status) where.status = filters.status;
    if (filters?.agentId) where.agentId = filters.agentId;
    if (filters?.feeAgentId) where.feeAgentId = filters.feeAgentId;
    if (filters?.search) {
      where.OR = [
        { penjualan: { noTransaksi: { contains: filters.search } } },
        { penjualan: { customer: { nama: { contains: filters.search } } } },
        { agent: { nama: { contains: filters.search } } },
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
      this.db.agentPencairan.count({ where }),
      this.db.agentPencairan.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ createdAt: "desc" }],
        include: AgentPencairanMapper.include,
      }),
    ]);

    const totalPages = Math.ceil(totalItems / limit) || 1;

    return {
      items: rows.map((r) => AgentPencairanMapper.toDomain(r)),
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

  async create(data: PersistAgentPencairanDTO): Promise<AgentPencairanEntity> {
    const result = await this.db.agentPencairan.create({
      data: {
        feeAgentId: data.feeAgentId,
        penjualanId: data.penjualanId,
        agentId: data.agentId,
        tahap: data.tahap,
        closingNominal: data.closingNominal,
        marketingNominal: data.marketingNominal,
        potonganPph: data.potonganPph,
        totalNominal: data.totalNominal,
        diajukanOlehId: data.diajukanOlehId,
        fileInvoice: data.fileInvoice ?? data.fileInvoiceList?.[0] ?? null,
        fileInvoiceList:
          data.fileInvoiceList && data.fileInvoiceList.length > 0
            ? data.fileInvoiceList
            : Prisma.JsonNull,
      },
      include: AgentPencairanMapper.include,
    });

    return AgentPencairanMapper.toDomain(result);
  }

  async updatePendingAjukan(
    id: number,
    data: {
      closingNominal: number;
      marketingNominal: number;
      potonganPph: number;
      totalNominal: number;
      fileInvoiceList?: string[];
    },
  ): Promise<AgentPencairanEntity> {
    const result = await this.db.agentPencairan.update({
      where: { id },
      data: {
        closingNominal: data.closingNominal,
        marketingNominal: data.marketingNominal,
        potonganPph: data.potonganPph,
        totalNominal: data.totalNominal,
        ...(data.fileInvoiceList !== undefined
          ? {
              fileInvoiceList:
                data.fileInvoiceList.length > 0
                  ? data.fileInvoiceList
                  : Prisma.JsonNull,
              fileInvoice: data.fileInvoiceList[0] ?? null,
            }
          : {}),
      },
      include: AgentPencairanMapper.include,
    });

    return AgentPencairanMapper.toDomain(result);
  }

  async markAsPaid(
    data: BayarAgentPencairanDTO,
  ): Promise<AgentPencairanEntity> {
    const tanggalPembayaran = data.tanggalPembayaran ?? new Date();

    const result = await this.db.$transaction(async (tx) => {
      const pencairan = await tx.agentPencairan.update({
        where: { id: data.id },
        data: {
          status: AgentPencairanStatus.SUDAH_DIBAYAR,
          buktiPembayaran: data.buktiPembayaran,
          tanggalPembayaran,
          dibayarOlehId: data.dibayarOlehId,
        },
        include: AgentPencairanMapper.include,
      });

      const closingNominal = Number(pencairan.closingNominal);
      const marketingNominal = Number(pencairan.marketingNominal);
      const existingFee = await tx.feeAgent.findUnique({
        where: { id: pencairan.feeAgentId },
      });
      const feeUpdate: Prisma.FeeAgentUpdateInput = {};

      if (closingNominal > 0) {
        feeUpdate.closingNominal = closingNominal;
        feeUpdate.closingTanggal = tanggalPembayaran;
        feeUpdate.closingBukti = data.buktiPembayaran;
      }
      if (marketingNominal > 0) {
        const prevMarketing = existingFee?.marketingNominal
          ? Number(existingFee.marketingNominal)
          : 0;
        feeUpdate.marketingNominal = prevMarketing + marketingNominal;
        feeUpdate.marketingTanggal = tanggalPembayaran;
        feeUpdate.marketingBukti = data.buktiPembayaran;
      }

      if (Object.keys(feeUpdate).length > 0) {
        await tx.feeAgent.update({
          where: { id: pencairan.feeAgentId },
          data: feeUpdate,
        });
      }

      return pencairan;
    });

    return AgentPencairanMapper.toDomain(result);
  }

  async setBsiCmsDilaporkan(
    data: SetAgentBsiCmsDilaporkanDTO,
  ): Promise<AgentPencairanEntity[]> {
    await this.db.agentPencairan.updateMany({
      where: { id: { in: data.ids } },
      data: {
        bsiCmsDilaporkan: data.dilaporkan,
        bsiCmsDilaporkanAt: data.dilaporkan ? new Date() : null,
      },
    });

    const rows = await this.db.agentPencairan.findMany({
      where: { id: { in: data.ids } },
      include: AgentPencairanMapper.include,
    });

    return rows.map((r) => AgentPencairanMapper.toDomain(r));
  }

  async deleteAndRollback(
    id: number,
    options: { allowPaid: boolean },
  ): Promise<"deleted" | "not_found" | "paid_forbidden"> {
    return await this.db.$transaction(async (tx) => {
      const pencairan = await tx.agentPencairan.findUnique({ where: { id } });
      if (!pencairan) return "not_found";

      if (pencairan.status === AgentPencairanStatus.SUDAH_DIBAYAR) {
        if (!options.allowPaid) return "paid_forbidden";

        const feeAgentId = pencairan.feeAgentId;
        const closingNominal = Number(pencairan.closingNominal);
        const marketingNominal = Number(pencairan.marketingNominal);
        const fee = await tx.feeAgent.findUnique({ where: { id: feeAgentId } });

        if (fee) {
          const feeUpdate: Prisma.FeeAgentUpdateInput = {};

          if (closingNominal > 0) {
            const remainingClosing = await tx.agentPencairan.findFirst({
              where: {
                feeAgentId,
                id: { not: id },
                status: AgentPencairanStatus.SUDAH_DIBAYAR,
                closingNominal: { gt: 0 },
              },
              orderBy: { tanggalPembayaran: "desc" },
            });

            if (remainingClosing) {
              feeUpdate.closingNominal = Number(remainingClosing.closingNominal);
              feeUpdate.closingTanggal = remainingClosing.tanggalPembayaran;
              feeUpdate.closingBukti = remainingClosing.buktiPembayaran;
            } else {
              feeUpdate.closingTanggal = null;
              feeUpdate.closingBukti = null;
            }
          }

          if (marketingNominal > 0) {
            const prev = fee.marketingNominal ? Number(fee.marketingNominal) : 0;
            const next = Math.max(0, prev - marketingNominal);
            const remainingMarketing = await tx.agentPencairan.findMany({
              where: {
                feeAgentId,
                id: { not: id },
                status: AgentPencairanStatus.SUDAH_DIBAYAR,
                marketingNominal: { gt: 0 },
              },
              orderBy: { tanggalPembayaran: "desc" },
            });

            feeUpdate.marketingNominal = next > 0 ? next : null;
            if (remainingMarketing.length > 0) {
              feeUpdate.marketingTanggal = remainingMarketing[0]!.tanggalPembayaran;
              feeUpdate.marketingBukti = remainingMarketing[0]!.buktiPembayaran;
            } else {
              feeUpdate.marketingTanggal = null;
              feeUpdate.marketingBukti = null;
            }
          }

          if (Object.keys(feeUpdate).length > 0) {
            await tx.feeAgent.update({
              where: { id: feeAgentId },
              data: feeUpdate,
            });
          }
        }
      }

      await tx.agentPencairan.delete({ where: { id } });
      return "deleted";
    });
  }
}
