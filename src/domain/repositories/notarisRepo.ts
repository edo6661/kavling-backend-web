import { Prisma } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";
import type { INotarisRepository } from "./INotarisRepo.js";
import type { NotarisEntity } from "../entities/Notaris.js";
import type {
  CreateNotarisDTO,
  UpdateNotarisDTO,
  NotarisFilterDTO,
} from "../dtos/NotarisDTO.js";
import type { CursorPaginatedData } from "../../types/response.js";
import { NotFoundError } from "../errors/NotFoundError.js";
import { NotarisMapper } from "../../infrastructure/mapper/NotarisMapper.js";
import { ConflictError } from "../errors/ConflictError.js";

export class NotarisRepository implements INotarisRepository {
  constructor(private readonly db: PrismaClient) {}

  async create(data: CreateNotarisDTO): Promise<NotarisEntity> {
    const createData: Prisma.NotarisCreateInput = {
      nama: data.nama,
      biayaAjb: data.biayaAjb,
    };

    if (data.pics && data.pics.length > 0) {
      createData.pics = {
        create: data.pics.map((p) => ({
          nama: p.nama,
          noHp: p.noHp,
          alamat: p.alamat ?? null,
        })),
      };
    }

    const result = await this.db.notaris.create({
      data: createData,
      include: { pics: true },
    });

    return NotarisMapper.toDomain(result);
  }

  async findById(id: number): Promise<NotarisEntity | null> {
    const result = await this.db.notaris.findUnique({
      where: { id },
      include: { pics: true },
    });
    if (!result) return null;
    return NotarisMapper.toDomain(result);
  }

  async update(id: number, data: UpdateNotarisDTO): Promise<NotarisEntity> {
    const existing = await this.findById(id);
    if (!existing) throw new NotFoundError("Notaris tidak ditemukan");

    const updateData: Prisma.NotarisUpdateInput = {};

    if (data.nama !== undefined) updateData.nama = data.nama;
    if (data.biayaAjb !== undefined) updateData.biayaAjb = data.biayaAjb;

    if (data.pics) {
      updateData.pics = {
        deleteMany: {},
        create: data.pics.map((p) => ({
          nama: p.nama,
          noHp: p.noHp,
          alamat: p.alamat ?? null,
        })),
      };
    }

    const result = await this.db.notaris.update({
      where: { id },
      data: updateData,
      include: { pics: true },
    });

    return NotarisMapper.toDomain(result);
  }

  async findWithCursorPagination(
    limit: number,
    cursor?: number,
    filters?: NotarisFilterDTO,
  ): Promise<CursorPaginatedData<NotarisEntity>> {
    const where: Prisma.NotarisWhereInput = {};

    if (filters?.search) {
      where.nama = { contains: filters.search };
    }

    const items = await this.db.notaris.findMany({
      take: limit + 1,
      ...(cursor && { skip: 1, cursor: { id: cursor } }),
      where,
      orderBy: [{ id: "desc" }],
      include: { pics: true },
    });

    let hasNextPage = false;
    if (items.length > limit) {
      hasNextPage = true;
      items.pop();
    }

    return {
      items: items.map((item) => NotarisMapper.toDomain(item)),
      meta: {
        nextCursor: hasNextPage ? (items.at(-1)?.id ?? null) : null,
        hasNextPage,
      },
    };
  }

  async delete(id: number): Promise<void> {
    const existing = await this.findById(id);
    if (!existing) throw new NotFoundError("Notaris tidak ditemukan");

    try {
      await this.db.notaris.delete({ where: { id } });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2003"
      ) {
        throw new ConflictError(
          "Notaris tidak dapat dihapus karena sudah digunakan di transaksi/AJB.",
        );
      }
      throw error;
    }
  }
}
