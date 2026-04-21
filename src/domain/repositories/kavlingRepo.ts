import { Prisma } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";
import type { IKavlingRepository } from "./IKavlingRepo.js";
import type { KavlingEntity } from "../entities/Kavling.js";
import type {
  CreateKavlingDTO,
  UpdateKavlingDTO,
  KavlingFilterDTO,
} from "../dtos/KavlingDTO.js";
import type { OffsetPaginatedData } from "../../types/response.js";
import { NotFoundError } from "../errors/NotFoundError.js";
import { ConflictError } from "../errors/ConflictError.js";
import { KavlingMapper } from "../../infrastructure/mapper/KavlingMapper.js";
export class KavlingRepository implements IKavlingRepository {
  constructor(private readonly db: PrismaClient) {}
  async create(data: CreateKavlingDTO): Promise<KavlingEntity> {
    try {
      const createData: Prisma.KavlingUncheckedCreateInput = {
        perumahanId: data.perumahanId,
        blok: data.blok,
        nomorUnit: data.nomorUnit,
        namaTipe: data.namaTipe,
        luasBangunan: data.luasBangunan,
        luasTanah: data.luasTanah,
        hargaDasar: data.hargaDasar,
        rekeningTujuanId: data.rekeningTujuanId ?? null,
        filePbg: data.filePbg ?? null,
        fileSertifikatTanah: data.fileSertifikatTanah ?? null,
        fileNopPbb: data.fileNopPbb ?? null,
      };
      if (data.status !== undefined) {
        createData.status = data.status;
      }
      const result = await this.db.kavling.create({
        data: createData,
        include: { perumahan: true, rekeningTujuan: true },
      });
      return KavlingMapper.toDomain(result);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
  async findById(id: number): Promise<KavlingEntity | null> {
    const result = await this.db.kavling.findUnique({
      where: { id },
      include: { perumahan: true, rekeningTujuan: true },
    });
    if (!result) return null;
    return KavlingMapper.toDomain(result);
  }
  async update(id: number, data: UpdateKavlingDTO): Promise<KavlingEntity> {
    const existing = await this.findById(id);
    if (!existing) throw new NotFoundError("Kavling tidak ditemukan");
    const updateData: Prisma.KavlingUncheckedUpdateInput = {};
    if (data.perumahanId !== undefined)
      updateData.perumahanId = data.perumahanId;
    if (data.blok !== undefined) updateData.blok = data.blok;
    if (data.nomorUnit !== undefined) updateData.nomorUnit = data.nomorUnit;
    if (data.namaTipe !== undefined) updateData.namaTipe = data.namaTipe;
    if (data.luasBangunan !== undefined)
      updateData.luasBangunan = data.luasBangunan;
    if (data.luasTanah !== undefined) updateData.luasTanah = data.luasTanah;
    if (data.hargaDasar !== undefined) updateData.hargaDasar = data.hargaDasar;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.rekeningTujuanId !== undefined)
      updateData.rekeningTujuanId = data.rekeningTujuanId ?? null;
    if (data.filePbg !== undefined) updateData.filePbg = data.filePbg ?? null;
    if (data.fileSertifikatTanah !== undefined)
      updateData.fileSertifikatTanah = data.fileSertifikatTanah ?? null;
    if (data.fileNopPbb !== undefined)
      updateData.fileNopPbb = data.fileNopPbb ?? null;
    const result = await this.db.kavling.update({
      where: { id },
      data: updateData,
      include: { perumahan: true, rekeningTujuan: true },
    });
    return KavlingMapper.toDomain(result);
  }
  async findWithCursorPagination(
    page: number,
    limit: number,
    filters?: KavlingFilterDTO,
  ): Promise<OffsetPaginatedData<KavlingEntity>> {
    const where: Prisma.KavlingWhereInput = {};
    if (filters?.perumahanId) where.perumahanId = filters.perumahanId;
    if (filters?.status) where.status = filters.status;
    if (filters?.search) {
      where.OR = [
        { blok: { contains: filters.search } },
        { nomorUnit: { contains: filters.search } },
        { namaTipe: { contains: filters.search } },
      ];
    }

    let orderByClause: Prisma.KavlingOrderByWithRelationInput[] = [
      { blok: "asc" },
      { nomorUnit: "asc" },
      { id: "desc" },
    ];

    if (filters?.orderBy) {
      const { field, direction } = filters.orderBy;
      const validFields = ["blok", "hargaDasar", "luasBangunan", "luasTanah"];
      if (validFields.includes(field)) {
        orderByClause = [{ [field]: direction }, { id: "asc" }];
      }
    }
    const skip = (page - 1) * limit;
    const summaryWhere: Prisma.KavlingWhereInput | undefined =
      filters?.perumahanId ? { perumahanId: filters.perumahanId } : undefined;
    const [items, totalItems, summaryData] = await Promise.all([
      this.db.kavling.findMany({
        take: limit,
        skip,
        where,
        orderBy: orderByClause,
        include: {
          perumahan: true,
          rekeningTujuan: true,
          penjualan: {
            where: { status: { not: "BATAL" } },
            include: { customer: { select: { nama: true, noHp: true } } },
            take: 1,
          },
        },
      }),
      this.db.kavling.count({ where }),
      this.db.kavling.groupBy({
        by: ["status"],
        _count: { id: true },
        ...(summaryWhere && { where: summaryWhere }),
      }),
    ]);
    const totalPages = Math.ceil(totalItems / limit);
    const summary = summaryData.reduce(
      (acc, curr) => {
        acc[curr.status] = curr._count.id;
        return acc;
      },
      {} as Record<string, number>,
    );
    return {
      items: items.map((item) => KavlingMapper.toDomain(item)),
      meta: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        summary,
      },
    };
  }
  async delete(id: number): Promise<void> {
    const existing = await this.findById(id);
    if (!existing) throw new NotFoundError("Kavling tidak ditemukan");
    try {
      await this.db.kavling.delete({ where: { id } });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2003"
      ) {
        throw new ConflictError(
          "Kavling tidak dapat dihapus karena sudah ada riwayat transaksi atau progress pembangunan.",
        );
      }
      throw error;
    }
  }
}
