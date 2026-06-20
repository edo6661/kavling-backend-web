import { Prisma } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";
import type { CreateZonaDTO, UpdateZonaDTO, ZonaFilterDTO } from "../dtos/ZonaDTO.js";
import type { ZonaEntity } from "../entities/Zona.js";
import { NotFoundError } from "../errors/NotFoundError.js";
import { ConflictError } from "../errors/ConflictError.js";

export interface IZonaRepository {
  create(data: CreateZonaDTO): Promise<ZonaEntity>;
  findById(id: number): Promise<ZonaEntity | null>;
  findAll(filters?: ZonaFilterDTO): Promise<ZonaEntity[]>;
  update(id: number, data: UpdateZonaDTO): Promise<ZonaEntity>;
  delete(id: number): Promise<void>;
}

export class ZonaRepository implements IZonaRepository {
  constructor(private readonly db: PrismaClient) {}

  private toEntity(row: {
    id: number;
    nama: string;
    hgb: string;
    luas: string;
    deskripsi: string;
    createdAt: Date;
    updatedAt: Date;
  }): ZonaEntity {
    return row;
  }

  async create(data: CreateZonaDTO): Promise<ZonaEntity> {
    const result = await this.db.zona.create({ data });
    return this.toEntity(result);
  }

  async findById(id: number): Promise<ZonaEntity | null> {
    const result = await this.db.zona.findUnique({ where: { id } });
    return result ? this.toEntity(result) : null;
  }

  async findAll(filters?: ZonaFilterDTO): Promise<ZonaEntity[]> {
    const where: Prisma.ZonaWhereInput = {};
    const search = filters?.search?.trim();
    if (search) {
      where.OR = [
        { nama: { contains: search } },
        { hgb: { contains: search } },
        { deskripsi: { contains: search } },
      ];
    }

    const rows = await this.db.zona.findMany({
      where,
      orderBy: [{ nama: "asc" }, { id: "asc" }],
    });
    return rows.map((row) => this.toEntity(row));
  }

  async update(id: number, data: UpdateZonaDTO): Promise<ZonaEntity> {
    const existing = await this.findById(id);
    if (!existing) throw new NotFoundError("Zona tidak ditemukan");

    const updateData: Prisma.ZonaUpdateInput = {};
    if (data.nama !== undefined) updateData.nama = data.nama;
    if (data.hgb !== undefined) updateData.hgb = data.hgb;
    if (data.luas !== undefined) updateData.luas = data.luas;
    if (data.deskripsi !== undefined) updateData.deskripsi = data.deskripsi;

    const result = await this.db.zona.update({ where: { id }, data: updateData });
    return this.toEntity(result);
  }

  async delete(id: number): Promise<void> {
    const existing = await this.findById(id);
    if (!existing) throw new NotFoundError("Zona tidak ditemukan");

    try {
      await this.db.zona.delete({ where: { id } });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2003"
      ) {
        throw new ConflictError(
          "Zona tidak dapat dihapus karena sudah terhubung dengan SPK.",
        );
      }
      throw error;
    }
  }
}
