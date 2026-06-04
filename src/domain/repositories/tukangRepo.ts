import type { PrismaClient } from "@prisma/client";
import { Role } from "@prisma/client";
import type {
  TukangFilterDTO,
  TukangListContext,
  UpsertTukangDTO,
} from "../dtos/TukangDTO.js";
import type { TukangEntity } from "../entities/Tukang.js";

const toEntity = (row: {
  id: number;
  nik: string;
  nama: string;
  mandorId: number | null;
  createdAt: Date;
  updatedAt: Date;
  mandor?: { username: string } | null;
}): TukangEntity => ({
  id: row.id,
  nik: row.nik,
  nama: row.nama,
  mandorId: row.mandorId,
  mandorUsername: row.mandor?.username ?? null,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

export class TukangRepository {
  constructor(private readonly db: PrismaClient) {}

  async findAll(
    filters: TukangFilterDTO | undefined,
    ctx: TukangListContext,
  ): Promise<TukangEntity[]> {
    const search = filters?.search?.trim();
    const where =
      ctx.role === Role.MANDOR
        ? {
            mandorId: ctx.userId,
            ...(search
              ? {
                  OR: [
                    { nik: { contains: search } },
                    { nama: { contains: search } },
                  ],
                }
              : {}),
          }
        : search
          ? {
              OR: [
                { nik: { contains: search } },
                { nama: { contains: search } },
              ],
            }
          : undefined;

    const rows = await this.db.tukang.findMany({
      where,
      orderBy: [{ nama: "asc" }],
      take: 500,
      include: {
        mandor: { select: { username: true } },
      },
    });

    return rows.map(toEntity);
  }

  async upsertForUser(
    data: UpsertTukangDTO,
    ctx: TukangListContext,
  ): Promise<TukangEntity> {
    const nik = data.nik.trim();
    const nama = data.nama.trim();
    const isMandor = ctx.role === Role.MANDOR;

    const existing = await this.db.tukang.findUnique({ where: { nik } });

    if (existing) {
      if (isMandor && existing.mandorId && existing.mandorId !== ctx.userId) {
        throw new Error("TUKANG_NIK_OTHER_MANDOR");
      }

      const row = await this.db.tukang.update({
        where: { id: existing.id },
        data: {
          nama,
          ...(isMandor ? { mandorId: ctx.userId } : {}),
        },
        include: { mandor: { select: { username: true } } },
      });
      return toEntity(row);
    }

    const row = await this.db.tukang.create({
      data: {
        nik,
        nama,
        mandorId: isMandor ? ctx.userId : null,
      },
      include: { mandor: { select: { username: true } } },
    });
    return toEntity(row);
  }

  async findByNik(nik: string): Promise<TukangEntity | null> {
    const row = await this.db.tukang.findUnique({
      where: { nik: nik.trim() },
      include: { mandor: { select: { username: true } } },
    });
    if (!row) return null;
    return toEntity(row);
  }
}
