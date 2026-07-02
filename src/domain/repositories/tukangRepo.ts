import type { PrismaClient } from "@prisma/client";
import { Role } from "@prisma/client";
import type {
  TukangFilterDTO,
  TukangListContext,
  UpsertTukangDTO,
} from "../dtos/TukangDTO.js";
import type { TukangEntity } from "../entities/Tukang.js";
import { normalizeTukangMaritalForSave } from "../tukang/tukangMarital.js";

const NIK_DIGIT_LENGTH = 16;

function normalizeNikDigits(nik: string): string {
  return nik.replace(/\D/g, "");
}

function assertNik16ForNewRecord(nik: string): void {
  if (normalizeNikDigits(nik).length !== NIK_DIGIT_LENGTH) {
    throw new Error("NIK_INVALID");
  }
}

const toEntity = (row: {
  id: number;
  nik: string;
  nama: string;
  fileKtp: string | null;
  sudahMenikah: boolean | null;
  jumlahAnak: number | null;
  mandorId: number | null;
  createdAt: Date;
  updatedAt: Date;
  mandor?: { username: string } | null;
}): TukangEntity => ({
  id: row.id,
  nik: row.nik,
  nama: row.nama,
  fileKtp: row.fileKtp,
  sudahMenikah: row.sudahMenikah,
  jumlahAnak: row.jumlahAnak,
  mandorId: row.mandorId,
  mandorUsername: row.mandor?.username ?? null,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

function buildMaritalUpdateData(data: UpsertTukangDTO) {
  const normalized = normalizeTukangMaritalForSave(data);
  if (!normalized) return {};
  return {
    sudahMenikah: normalized.sudahMenikah,
    jumlahAnak: normalized.jumlahAnak,
  };
}

function assertMandorCanAccess(
  existing: { mandorId: number | null },
  ctx: TukangListContext,
): void {
  if (
    ctx.role === Role.MANDOR &&
    existing.mandorId &&
    existing.mandorId !== ctx.userId
  ) {
    throw new Error("TUKANG_NIK_OTHER_MANDOR");
  }
}

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
    const maritalData = buildMaritalUpdateData(data);
    const isMandor = ctx.role === Role.MANDOR;

    const existing = await this.db.tukang.findUnique({ where: { nik } });

    if (existing) {
      assertMandorCanAccess(existing, ctx);

      const row = await this.db.tukang.update({
        where: { id: existing.id },
        data: {
          nama,
          ...maritalData,
          ...(isMandor ? { mandorId: ctx.userId } : {}),
        },
        include: { mandor: { select: { username: true } } },
      });
      return toEntity(row);
    }

    assertNik16ForNewRecord(nik);

    const row = await this.db.tukang.create({
      data: {
        nik,
        nama,
        ...maritalData,
        mandorId: isMandor ? ctx.userId : null,
      },
      include: { mandor: { select: { username: true } } },
    });
    return toEntity(row);
  }

  async updateFileKtp(
    nik: string,
    fileKtp: string,
    ctx: TukangListContext,
  ): Promise<TukangEntity> {
    const existing = await this.db.tukang.findUnique({
      where: { nik: nik.trim() },
    });
    if (!existing) throw new Error("TUKANG_NOT_FOUND");

    assertMandorCanAccess(existing, ctx);

    const row = await this.db.tukang.update({
      where: { id: existing.id },
      data: { fileKtp },
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
