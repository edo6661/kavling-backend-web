import type { PrismaClient } from "@prisma/client";
import type { TukangFilterDTO, UpsertTukangDTO } from "../dtos/TukangDTO.js";
import type { TukangEntity } from "../entities/Tukang.js";

export class TukangRepository {
  constructor(private readonly db: PrismaClient) {}

  async findAll(filters?: TukangFilterDTO): Promise<TukangEntity[]> {
    const where =
      filters?.search?.trim()
        ? {
            OR: [
              { nik: { contains: filters.search.trim() } },
              { nama: { contains: filters.search.trim() } },
            ],
          }
        : undefined;

    const rows = await this.db.tukang.findMany({
      where,
      orderBy: [{ nama: "asc" }],
      take: 500,
    });

    return rows.map((r) => ({
      id: r.id,
      nik: r.nik,
      nama: r.nama,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
  }

  async upsertByNik(data: UpsertTukangDTO): Promise<TukangEntity> {
    const nik = data.nik.trim();
    const nama = data.nama.trim();
    const row = await this.db.tukang.upsert({
      where: { nik },
      create: { nik, nama },
      update: { nama },
    });
    return {
      id: row.id,
      nik: row.nik,
      nama: row.nama,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async findByNik(nik: string): Promise<TukangEntity | null> {
    const row = await this.db.tukang.findUnique({ where: { nik: nik.trim() } });
    if (!row) return null;
    return {
      id: row.id,
      nik: row.nik,
      nama: row.nama,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
