import type { Prisma, PrismaClient } from "@prisma/client";
import { Role } from "@prisma/client";
import type {
  TukangFilterDTO,
  TukangListContext,
  UpsertTukangDTO,
} from "../dtos/TukangDTO.js";
import type { TukangEntity } from "../entities/Tukang.js";
import { ConflictError } from "../errors/ConflictError.js";
import { NotFoundError } from "../errors/NotFoundError.js";
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

  /**
   * NIK/nama di pengajuan upah disimpan sebagai snapshot.
   * Saat master tukang dikoreksi, sync agar Convert to XML & halaman Upah tetap valid.
   */
  private async syncUpahBarisSnapshot(
    tx: Prisma.TransactionClient,
    tukangId: number,
    next: { nik: string; nama: string },
    previousNik?: string | null,
  ): Promise<void> {
    await tx.spkPembayaranUpahBaris.updateMany({
      where: { tukangId },
      data: { nik: next.nik, nama: next.nama },
    });

    // Baris orphan (tukangId null) yang masih pakai NIK lama ikut dilink + dikoreksi.
    if (previousNik && previousNik !== next.nik) {
      await tx.spkPembayaranUpahBaris.updateMany({
        where: { nik: previousNik, tukangId: null },
        data: { nik: next.nik, nama: next.nama, tukangId },
      });
    }
  }

  /**
   * @param limit `null` = tanpa batas (untuk export). Default 500 untuk list UI.
   */
  async findAll(
    filters: TukangFilterDTO | undefined,
    ctx: TukangListContext,
    limit: number | null = 500,
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
      ...(limit != null ? { take: limit } : {}),
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
    const originalNik = data.originalNik?.trim() || null;
    const maritalData = buildMaritalUpdateData(data);
    const isMandor = ctx.role === Role.MANDOR;

    // Edit: lookup by NIK lama agar koreksi NIK meng-update baris yang sama (bukan create).
    if (originalNik) {
      const existing = await this.db.tukang.findUnique({
        where: { nik: originalNik },
      });
      if (!existing) throw new Error("TUKANG_NOT_FOUND");
      assertMandorCanAccess(existing, ctx);

      if (nik !== originalNik) {
        assertNik16ForNewRecord(nik);
        const conflict = await this.db.tukang.findUnique({ where: { nik } });
        if (conflict && conflict.id !== existing.id) {
          throw new Error("TUKANG_NIK_DUPLICATE");
        }
      }

      const row = await this.db.$transaction(async (tx) => {
        const updated = await tx.tukang.update({
          where: { id: existing.id },
          data: {
            nik,
            nama,
            ...maritalData,
            ...(isMandor ? { mandorId: ctx.userId } : {}),
          },
          include: { mandor: { select: { username: true } } },
        });
        await this.syncUpahBarisSnapshot(
          tx,
          existing.id,
          { nik, nama },
          originalNik,
        );
        return updated;
      });
      return toEntity(row);
    }

    const existing = await this.db.tukang.findUnique({ where: { nik } });

    if (existing) {
      assertMandorCanAccess(existing, ctx);

      const row = await this.db.$transaction(async (tx) => {
        const updated = await tx.tukang.update({
          where: { id: existing.id },
          data: {
            nama,
            ...maritalData,
            ...(isMandor ? { mandorId: ctx.userId } : {}),
          },
          include: { mandor: { select: { username: true } } },
        });
        await this.syncUpahBarisSnapshot(tx, existing.id, {
          nik: existing.nik,
          nama,
        });
        return updated;
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

  async deleteForUser(id: number, ctx: TukangListContext): Promise<void> {
    const existing = await this.db.tukang.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Tukang tidak ditemukan");
    assertMandorCanAccess(existing, ctx);

    const usedInUpah = await this.db.spkPembayaranUpahBaris.count({
      where: {
        OR: [{ tukangId: id }, { nik: existing.nik }],
      },
    });

    if (usedInUpah > 0) {
      throw new ConflictError(
        "Tidak bisa menghapus tukang karena tukang sudah ada di upah tukang atau SPK.",
      );
    }

    await this.db.tukang.delete({ where: { id } });
  }
}
