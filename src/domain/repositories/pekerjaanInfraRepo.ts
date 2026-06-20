import { Prisma, PekerjaanInfraKategori } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";
import type {
  CreatePekerjaanInfraDTO,
  UpdatePekerjaanInfraDTO,
} from "../dtos/PekerjaanInfraDTO.js";
import type { PekerjaanInfraEntity } from "../entities/PekerjaanInfra.js";
import { NotFoundError } from "../errors/NotFoundError.js";
import { ConflictError } from "../errors/ConflictError.js";

export interface IPekerjaanInfraRepository {
  findAllActive(): Promise<PekerjaanInfraEntity[]>;
  create(data: CreatePekerjaanInfraDTO): Promise<PekerjaanInfraEntity>;
  findById(id: number): Promise<PekerjaanInfraEntity | null>;
  update(id: number, data: UpdatePekerjaanInfraDTO): Promise<PekerjaanInfraEntity>;
  delete(id: number): Promise<void>;
}

export class PekerjaanInfraRepository implements IPekerjaanInfraRepository {
  constructor(private readonly db: PrismaClient) {}

  async findAllActive(): Promise<PekerjaanInfraEntity[]> {
    const rows = await this.db.pekerjaanInfra.findMany({
      where: { isActive: true },
      orderBy: [{ urutan: "asc" }, { id: "asc" }],
    });
    return rows;
  }

  async create(data: CreatePekerjaanInfraDTO): Promise<PekerjaanInfraEntity> {
    const maxUrutan = await this.db.pekerjaanInfra.aggregate({
      _max: { urutan: true },
    });
    const urutan = data.urutan ?? (maxUrutan._max.urutan ?? 0) + 1;
    const kategori = data.kategori ?? PekerjaanInfraKategori.LAINNYA;

    try {
      return await this.db.pekerjaanInfra.create({
        data: { nama: data.nama.trim(), urutan, kategori, isActive: true },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictError("Nama pekerjaan infrastruktur sudah terdaftar.");
      }
      throw error;
    }
  }

  async findById(id: number): Promise<PekerjaanInfraEntity | null> {
    return await this.db.pekerjaanInfra.findUnique({ where: { id } });
  }

  async update(id: number, data: UpdatePekerjaanInfraDTO): Promise<PekerjaanInfraEntity> {
    const existing = await this.findById(id);
    if (!existing) throw new NotFoundError("Pekerjaan infrastruktur tidak ditemukan");

    const updateData: Prisma.PekerjaanInfraUpdateInput = {};
    if (data.nama !== undefined) updateData.nama = data.nama.trim();
    if (data.kategori !== undefined) updateData.kategori = data.kategori;
    if (data.urutan !== undefined) updateData.urutan = data.urutan;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    try {
      return await this.db.pekerjaanInfra.update({
        where: { id },
        data: updateData,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictError("Nama pekerjaan infrastruktur sudah digunakan.");
      }
      throw error;
    }
  }

  async delete(id: number): Promise<void> {
    const existing = await this.findById(id);
    if (!existing) throw new NotFoundError("Pekerjaan infrastruktur tidak ditemukan");

    const usedCount = await this.db.spkPekerjaanInfra.count({
      where: { pekerjaanInfraId: id },
    });

    if (usedCount > 0) {
      await this.db.pekerjaanInfra.update({
        where: { id },
        data: { isActive: false },
      });
      return;
    }

    await this.db.pekerjaanInfra.delete({ where: { id } });
  }
}
