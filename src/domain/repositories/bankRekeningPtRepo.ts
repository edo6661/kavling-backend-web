import { Prisma } from "@prisma/client";
import type { PrismaClient, BankRekeningPt } from "@prisma/client";
import type { IBankRekeningPtRepository } from "./IBankRekeningPtRepo.js";
import type {
  CreateBankRekeningPtDTO,
  UpdateBankRekeningPtDTO,
  BankRekeningPtFilterDTO,
} from "../dtos/BankRekeningPtDTO.js";
import type { CursorPaginatedData } from "../../types/response.js";
import { NotFoundError } from "../errors/NotFoundError.js";
import { ConflictError } from "../errors/ConflictError.js";

export class BankRekeningPtRepository implements IBankRekeningPtRepository {
  constructor(private readonly db: PrismaClient) {}

  async create(data: CreateBankRekeningPtDTO): Promise<BankRekeningPt> {
    const checkDuplicate = await this.db.bankRekeningPt.findFirst({
      where: { noRekening: data.noRekening },
    });
    if (checkDuplicate) {
      throw new ConflictError("Nomor rekening sudah terdaftar");
    }

    const result = await this.db.bankRekeningPt.create({
      data: {
        namaBank: data.namaBank,
        noRekening: data.noRekening,
        atasNama: data.atasNama,
      },
    });
    return result;
  }

  async findById(id: number): Promise<BankRekeningPt | null> {
    return await this.db.bankRekeningPt.findUnique({ where: { id } });
  }

  async update(
    id: number,
    data: UpdateBankRekeningPtDTO,
  ): Promise<BankRekeningPt> {
    const existing = await this.findById(id);
    if (!existing) throw new NotFoundError("Rekening tidak ditemukan");

    if (data.noRekening && data.noRekening !== existing.noRekening) {
      const checkDuplicate = await this.db.bankRekeningPt.findFirst({
        where: { noRekening: data.noRekening },
      });
      if (checkDuplicate) {
        throw new ConflictError("Nomor rekening sudah digunakan");
      }
    }

    const updateData: Prisma.BankRekeningPtUpdateInput = {};
    if (data.namaBank !== undefined) updateData.namaBank = data.namaBank;
    if (data.noRekening !== undefined) updateData.noRekening = data.noRekening;
    if (data.atasNama !== undefined) updateData.atasNama = data.atasNama;

    return await this.db.bankRekeningPt.update({
      where: { id },
      data: updateData,
    });
  }
  async findWithCursorPagination(
    limit: number,
    cursor?: number,
    filters?: BankRekeningPtFilterDTO,
  ): Promise<CursorPaginatedData<BankRekeningPt>> {
    const where: Prisma.BankRekeningPtWhereInput = {};

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    if (filters?.search) {
      where.OR = [
        { namaBank: { contains: filters.search } },
        { atasNama: { contains: filters.search } },
        { noRekening: { contains: filters.search } },
      ];
    }

    let orderByClause: Prisma.BankRekeningPtOrderByWithRelationInput[] = [
      { createdAt: "desc" },
      { id: "asc" },
    ];

    if (filters?.orderBy) {
      const { field, direction } = filters.orderBy;
      const validFields = ["namaBank", "atasNama", "noRekening", "createdAt"];
      if (validFields.includes(field)) {
        orderByClause = [{ [field]: direction }, { id: "asc" }];
      }
    }

    const items = await this.db.bankRekeningPt.findMany({
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
    if (!existing) throw new NotFoundError("Rekening tidak ditemukan");

    try {
      await this.db.bankRekeningPt.delete({ where: { id } });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2003"
      ) {
        throw new ConflictError(
          "Rekening tidak dapat dihapus karena sudah terhubung dengan data SPR.",
        );
      }
      throw error;
    }
  }
}
