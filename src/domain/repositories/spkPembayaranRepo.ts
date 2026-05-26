import { Prisma, SpkPembayaranStatus } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";
import type { ISpkPembayaranRepository } from "./ISpkPembayaranRepo.js";
import type {
  BayarSpkPembayaranDTO,
  CreateSpkPembayaranDTO,
  SpkPembayaranFilterDTO,
} from "../dtos/SpkPembayaranDTO.js";
import type { SpkPembayaranEntity } from "../entities/SpkPembayaran.js";
import type { OffsetPaginatedData } from "../../types/response.js";
import { SpkPembayaranMapper } from "../../infrastructure/mapper/SpkPembayaranMapper.js";
import {
  calcSpkPembayaranNominal,
  calcNilaiBisaDitagihkan,
} from "../spk/spkPembayaranCalc.js";
export class SpkPembayaranRepository implements ISpkPembayaranRepository {
  constructor(private readonly db: PrismaClient) {}

  private async syncSpkNominals(
    tx: Prisma.TransactionClient,
    spkId: number,
    progress: number,
  ) {
    const spk = await tx.spk.findUnique({ where: { id: spkId } });
    if (!spk) return;

    const pembayaranRows = await tx.spkPembayaran.findMany({
      where: { spkId },
      select: { jenis: true, status: true, nominal: true },
    });

    const paidTotal = pembayaranRows
      .filter((p) => p.status === SpkPembayaranStatus.SUDAH_DIBAYAR)
      .reduce((sum, p) => sum + Number(p.nominal), 0);

    const nilaiKontrak = Number(spk.nilaiKontrak);
    const bisaDitagihkan = calcNilaiBisaDitagihkan(
      {
        nilaiKontrak,
        kasbonSebelumTermin2: spk.kasbonSebelumTermin2
          ? Number(spk.kasbonSebelumTermin2)
          : null,
        kasbonSebelumTermin3: spk.kasbonSebelumTermin3
          ? Number(spk.kasbonSebelumTermin3)
          : null,
        progress,
      },
      pembayaranRows.map((p) => ({
        jenis: p.jenis,
        status: p.status,
      })),
    );

    await tx.spk.update({
      where: { id: spkId },
      data: {
        nilaiSudahDibayarkan: new Prisma.Decimal(paidTotal),
        nilaiBisaDitagihkan: new Prisma.Decimal(bisaDitagihkan),
      },
    });
  }

  async findBySpkId(spkId: number): Promise<SpkPembayaranEntity[]> {
    const rows = await this.db.spkPembayaran.findMany({
      where: { spkId },
      orderBy: [{ createdAt: "asc" }],
      include: SpkPembayaranMapper.include,
    });
    return rows.map((r) => SpkPembayaranMapper.toDomain(r));
  }

  async findById(id: number): Promise<SpkPembayaranEntity | null> {
    const row = await this.db.spkPembayaran.findUnique({
      where: { id },
      include: SpkPembayaranMapper.include,
    });
    if (!row) return null;
    return SpkPembayaranMapper.toDomain(row);
  }

  async createRequest(data: CreateSpkPembayaranDTO): Promise<SpkPembayaranEntity> {
    return await this.db.$transaction(async (tx) => {
      const spk = await tx.spk.findUnique({
        where: { id: data.spkId },
        select: {
          id: true,
          nilaiKontrak: true,
          kasbonSebelumTermin2: true,
          kasbonSebelumTermin3: true,
          progressOverride: true,
          penjualanItems: { select: { kavlingId: true } },
        },
      });
      if (!spk) throw new Error("SPK_NOT_FOUND");

      const nominal = calcSpkPembayaranNominal(data.jenis, {
        nilaiKontrak: Number(spk.nilaiKontrak),
        kasbonSebelumTermin2: spk.kasbonSebelumTermin2
          ? Number(spk.kasbonSebelumTermin2)
          : null,
        kasbonSebelumTermin3: spk.kasbonSebelumTermin3
          ? Number(spk.kasbonSebelumTermin3)
          : null,
      });

      const result = await tx.spkPembayaran.create({
        data: {
          spkId: data.spkId,
          jenis: data.jenis,
          nominal: new Prisma.Decimal(nominal),
          diajukanOlehId: data.diajukanOlehId,
        },
        include: SpkPembayaranMapper.include,
      });

      return SpkPembayaranMapper.toDomain(result);
    });
  }

  async createRequestWithSync(
    data: CreateSpkPembayaranDTO,
    progress: number,
  ): Promise<SpkPembayaranEntity> {
    const created = await this.createRequest(data);
    await this.syncSpkNominalsForSpk(data.spkId, progress);
    return created;
  }

  async markAsPaid(data: BayarSpkPembayaranDTO): Promise<SpkPembayaranEntity> {
    return await this.db.$transaction(async (tx) => {
      const existing = await tx.spkPembayaran.findUnique({
        where: { id: data.id },
      });
      if (!existing) throw new Error("SPK_PEMBAYARAN_NOT_FOUND");

      const result = await tx.spkPembayaran.update({
        where: { id: data.id },
        data: {
          status: SpkPembayaranStatus.SUDAH_DIBAYAR,
          buktiPembayaran: data.buktiPembayaran,
          tanggalPembayaran: data.tanggalPembayaran ?? new Date(),
          dibayarOlehId: data.dibayarOlehId,
        },
        include: SpkPembayaranMapper.include,
      });

      return SpkPembayaranMapper.toDomain(result);
    });
  }

  async markAsPaidWithSync(
    data: BayarSpkPembayaranDTO,
    progress: number,
  ): Promise<SpkPembayaranEntity> {
    const paid = await this.markAsPaid(data);
    await this.syncSpkNominalsForSpk(paid.spkId, progress);
    return paid;
  }

  async syncSpkNominalsForSpk(spkId: number, progress: number): Promise<void> {
    await this.db.$transaction(async (tx) => {
      await this.syncSpkNominals(tx, spkId, progress);
    });
  }

  async findPaginated(
    page: number,
    limit: number,
    filters?: SpkPembayaranFilterDTO,
  ): Promise<OffsetPaginatedData<SpkPembayaranEntity>> {
    const where: Prisma.SpkPembayaranWhereInput = {};

    if (filters?.status) where.status = filters.status;
    if (filters?.spkId) where.spkId = filters.spkId;
    if (filters?.search) {
      where.OR = [
        { spk: { noSpk: { contains: filters.search } } },
        { spk: { judulPekerjaan: { contains: filters.search } } },
        { spk: { mandor: { username: { contains: filters.search } } } },
      ];
    }

    const skip = (page - 1) * limit;
    const [totalItems, rows] = await Promise.all([
      this.db.spkPembayaran.count({ where }),
      this.db.spkPembayaran.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ updatedAt: "desc" }],
        include: SpkPembayaranMapper.include,
      }),
    ]);

    const totalPages = Math.ceil(totalItems / limit) || 1;

    return {
      items: rows.map((r) => SpkPembayaranMapper.toDomain(r)),
      meta: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }
}
