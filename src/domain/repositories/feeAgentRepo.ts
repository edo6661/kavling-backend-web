import type { Prisma, PrismaClient } from "@prisma/client";
import type { IFeeAgentRepository } from "./IFeeAgentRepo.js";
import type { CursorPaginatedData } from "../../types/response.js";
import { NotFoundError } from "../errors/NotFoundError.js";
import { ConflictError } from "../errors/ConflictError.js";
import { FeeAgentMapper } from "../../infrastructure/mapper/FeeAgentMapper.js";
import { resolveAgentCommercialProfile } from "../agent/agentCommercialProfile.js";
import type {
  CreateFeeAgentDTO,
  UpdateFeeAgentDTO,
  FeeAgentFilterDTO,
  FeeAgentResponseDTO,
} from "../dtos/FeeAgentDTO.js";

const includeRelations = {
  agent: { select: { nama: true } },
  penjualan: {
    include: {
      customer: { select: { nama: true } },
      kavling: {
        include: { perumahan: { select: { nama: true } } },
      },
    },
  },
} satisfies Prisma.FeeAgentInclude;

/** Penjualan yang boleh punya baris fee_agent (termasuk BATAL + flag booking fee lunas). */
const penjualanEligibleForFeeAgentWhere = {
  agentId: { not: null },
  OR: [
    { status: { not: "BATAL" } },
    {
      status: "BATAL",
      bookingFeeLunasBatal: true,
    },
  ],
} satisfies Prisma.PenjualanWhereInput;

export class FeeAgentRepository implements IFeeAgentRepository {
  constructor(private readonly db: PrismaClient) {}

  async create(data: CreateFeeAgentDTO): Promise<FeeAgentResponseDTO> {
    const existing = await this.findByPenjualanId(data.penjualanId);
    if (existing) {
      throw new ConflictError("Data Fee Agent untuk Penjualan ini sudah ada.");
    }

    const result = await this.db.feeAgent.create({
      data: {
        agentId: data.agentId,
        penjualanId: data.penjualanId,
      },
      include: includeRelations,
    });

    return FeeAgentMapper.toDomain(result);
  }

  async findById(id: number): Promise<FeeAgentResponseDTO | null> {
    const result = await this.db.feeAgent.findUnique({
      where: { id },
      include: includeRelations,
    });
    if (!result) return null;
    return FeeAgentMapper.toDomain(result);
  }

  async findByPenjualanId(
    penjualanId: number,
  ): Promise<FeeAgentResponseDTO | null> {
    const result = await this.db.feeAgent.findUnique({
      where: { penjualanId },
      include: includeRelations,
    });
    if (!result) return null;
    return FeeAgentMapper.toDomain(result);
  }

  async update(
    id: number,
    data: UpdateFeeAgentDTO,
  ): Promise<FeeAgentResponseDTO> {
    const existing = await this.findById(id);
    if (!existing) throw new NotFoundError("Data Fee Agent tidak ditemukan");

    const updateData: Prisma.FeeAgentUpdateInput = {};

    if (data.bookingNominal !== undefined)
      updateData.bookingNominal = data.bookingNominal;
    if (data.bookingTanggal !== undefined) {
      updateData.bookingTanggal = data.bookingTanggal
        ? new Date(data.bookingTanggal)
        : null;
    }
    if (data.bookingBukti !== undefined)
      updateData.bookingBukti = data.bookingBukti;

    if (data.closingNominal !== undefined)
      updateData.closingNominal = data.closingNominal;
    if (data.closingTanggal !== undefined) {
      updateData.closingTanggal = data.closingTanggal
        ? new Date(data.closingTanggal)
        : null;
    }
    if (data.closingBukti !== undefined)
      updateData.closingBukti = data.closingBukti;

    if (data.marketingNominal !== undefined)
      updateData.marketingNominal = data.marketingNominal;
    if (data.marketingTanggal !== undefined) {
      updateData.marketingTanggal = data.marketingTanggal
        ? new Date(data.marketingTanggal)
        : null;
    }
    if (data.marketingBukti !== undefined)
      updateData.marketingBukti = data.marketingBukti;

    const result = await this.db.feeAgent.update({
      where: { id },
      data: updateData,
      include: includeRelations,
    });

    return FeeAgentMapper.toDomain(result as any);
  }

  async findWithCursorPagination(
    limit: number,
    cursor?: number,
    filters?: FeeAgentFilterDTO,
  ): Promise<CursorPaginatedData<FeeAgentResponseDTO>> {
    const where: Prisma.FeeAgentWhereInput = {};

    if (filters?.agentId) where.agentId = filters.agentId;
    if (filters?.penjualanId) where.penjualanId = filters.penjualanId;

    if (filters?.search) {
      where.OR = [
        { agent: { nama: { contains: filters.search } } },
        { penjualan: { noTransaksi: { contains: filters.search } } },
        { penjualan: { customer: { nama: { contains: filters.search } } } },
      ];
    }

    const items = await this.db.feeAgent.findMany({
      take: limit + 1,
      ...(cursor && { skip: 1, cursor: { id: cursor } }),
      where,
      orderBy: [{ createdAt: "desc" }],
      include: includeRelations,
    });

    let hasNextPage = false;
    if (items.length > limit) {
      hasNextPage = true;
      items.pop();
    }

    return {
      items: items.map((item) => FeeAgentMapper.toDomain(item as any)),
      meta: {
        nextCursor: hasNextPage ? (items.at(-1)?.id ?? null) : null,
        hasNextPage,
      },
    };
  }

  async backfillMissing(): Promise<{ created: number; synced: number }> {
    const missing = await this.db.penjualan.findMany({
      where: {
        ...penjualanEligibleForFeeAgentWhere,
        feeAgent: null,
      },
      select: {
        id: true,
        agentId: true,
        agent: {
          include: { perusahaanAgent: true },
        },
      },
    });

    let created = 0;
    if (missing.length > 0) {
      const result = await this.db.feeAgent.createMany({
        data: missing.map((p) => {
          const commercial = resolveAgentCommercialProfile(p.agent!);
          return {
            agentId: p.agentId!,
            penjualanId: p.id,
            ...(commercial.feeClosingNominal != null &&
            commercial.feeClosingNominal > 0
              ? { closingNominal: commercial.feeClosingNominal }
              : {}),
          };
        }),
        skipDuplicates: true,
      });
      created = result.count;
    }

    const synced = await this.syncCommercialClosingSnapshots();

    return { created, synced };
  }

  /** Salin fee closing dari master agent/perusahaan ke fee_agent yang masih null */
  private async syncCommercialClosingSnapshots(): Promise<number> {
    const rows = await this.db.feeAgent.findMany({
      where: { closingNominal: null },
      select: {
        id: true,
        agent: { include: { perusahaanAgent: true } },
      },
    });

    let synced = 0;
    for (const row of rows) {
      const commercial = resolveAgentCommercialProfile(row.agent);
      if (
        commercial.feeClosingNominal == null ||
        commercial.feeClosingNominal <= 0
      ) {
        continue;
      }
      await this.db.feeAgent.update({
        where: { id: row.id },
        data: { closingNominal: commercial.feeClosingNominal },
      });
      synced += 1;
    }
    return synced;
  }
}
