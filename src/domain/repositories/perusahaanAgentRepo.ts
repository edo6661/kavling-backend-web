import type { Prisma, PrismaClient } from "@prisma/client";
import type { IPerusahaanAgentRepository } from "./IPerusahaanAgentRepo.js";
import type { PerusahaanAgentEntity } from "../entities/PerusahaanAgent.js";
import type {
  CreatePerusahaanAgentDTO,
  UpdatePerusahaanAgentDTO,
  PerusahaanAgentFilterDTO,
} from "../dtos/PerusahaanAgentDTO.js";
import type { CursorPaginatedData } from "../../types/response.js";
import { NotFoundError } from "../errors/NotFoundError.js";
import { PerusahaanAgentMapper } from "../../infrastructure/mapper/PerusahaanAgentMapper.js";

export class PerusahaanAgentRepository implements IPerusahaanAgentRepository {
  constructor(private readonly db: PrismaClient) {}

  async create(data: CreatePerusahaanAgentDTO): Promise<PerusahaanAgentEntity> {
    const result = await this.db.perusahaanAgent.create({
      data: {
        nama: data.nama,
        npwp: data.npwp ?? null,
        namaBank: data.namaBank ?? null,
        noRekening: data.noRekening ?? null,
        atasNamaRekening: data.atasNamaRekening ?? null,
        feeMarketingPct: data.feeMarketingPct ?? null,
        feeClosingNominal: data.feeClosingNominal ?? null,
        potonganPph: data.potonganPph ?? null,
        isPkp: data.isPkp ?? false,
      },
    });
    return PerusahaanAgentMapper.toDomain(result);
  }
  async findById(id: number): Promise<PerusahaanAgentEntity | null> {
    const result = await this.db.perusahaanAgent.findUnique({ where: { id } });
    if (!result) return null;
    return PerusahaanAgentMapper.toDomain(result);
  }

  async update(
    id: number,
    data: UpdatePerusahaanAgentDTO,
  ): Promise<PerusahaanAgentEntity> {
    const existing = await this.findById(id);
    if (!existing) throw new NotFoundError("Perusahaan Agent tidak ditemukan");

    const updateData: Prisma.PerusahaanAgentUpdateInput = {};
    if (data.nama !== undefined) updateData.nama = data.nama;
    if (data.npwp !== undefined) updateData.npwp = data.npwp;
    if (data.namaBank !== undefined) updateData.namaBank = data.namaBank;
    if (data.noRekening !== undefined) updateData.noRekening = data.noRekening;
    if (data.atasNamaRekening !== undefined)
      updateData.atasNamaRekening = data.atasNamaRekening;
    if (data.feeMarketingPct !== undefined)
      updateData.feeMarketingPct = data.feeMarketingPct;
    if (data.feeClosingNominal !== undefined)
      updateData.feeClosingNominal = data.feeClosingNominal;
    if (data.potonganPph !== undefined) updateData.potonganPph = data.potonganPph;
    if (data.isPkp !== undefined) updateData.isPkp = data.isPkp;
    if (data.akte !== undefined) updateData.akte = data.akte;

    const result = await this.db.perusahaanAgent.update({
      where: { id },
      data: updateData,
    });
    return PerusahaanAgentMapper.toDomain(result);
  }

  async delete(id: number): Promise<void> {
    const existing = await this.findById(id);
    if (!existing) throw new NotFoundError("Perusahaan Agent tidak ditemukan");
    await this.db.perusahaanAgent.delete({ where: { id } });
  }

  async findWithCursorPagination(
    limit: number,
    cursor?: number,
    filters?: PerusahaanAgentFilterDTO,
  ): Promise<CursorPaginatedData<PerusahaanAgentEntity>> {
    const where: Prisma.PerusahaanAgentWhereInput = {};

    if (filters?.search) {
      where.nama = { contains: filters.search };
    }

    const items = await this.db.perusahaanAgent.findMany({
      take: limit + 1,
      ...(cursor && { skip: 1, cursor: { id: cursor } }),
      where,
      orderBy: [{ createdAt: "desc" }],
    });

    let hasNextPage = false;
    if (items.length > limit) {
      hasNextPage = true;
      items.pop();
    }

    return {
      items: items.map((item) => PerusahaanAgentMapper.toDomain(item)),
      meta: {
        nextCursor: hasNextPage ? (items.at(-1)?.id ?? null) : null,
        hasNextPage,
      },
    };
  }
}
