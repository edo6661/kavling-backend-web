import { Prisma } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";
import type { IKavlingRepository } from "./IKavlingRepo.js";
import type { KavlingEntity } from "../entities/Kavling.js";
import type {
  CreateKavlingDTO,
  UpdateKavlingDTO,
  KavlingFilterDTO,
} from "../dtos/KavlingDTO.js";
import type { CursorPaginatedData } from "../../types/response.js";
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
        hargaJual: data.hargaJual,
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
    if (data.hargaJual !== undefined) updateData.hargaJual = data.hargaJual;
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
    limit: number,
    cursor?: number,
    filters?: KavlingFilterDTO,
  ): Promise<CursorPaginatedData<KavlingEntity>> {
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

    const items = await this.db.kavling.findMany({
      take: limit + 1,
      ...(cursor && { skip: 1, cursor: { id: cursor } }),
      where,
      orderBy: [{ id: "desc" }],
      include: { perumahan: true, rekeningTujuan: true },
    });

    let hasNextPage = false;
    if (items.length > limit) {
      hasNextPage = true;
      items.pop();
    }

    return {
      items: items.map((item) => KavlingMapper.toDomain(item)),
      meta: {
        nextCursor: hasNextPage ? (items.at(-1)?.id ?? null) : null,
        hasNextPage,
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
