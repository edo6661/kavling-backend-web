import { Prisma } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";
import type { IKavlingRepository } from "./IKavlingRepo.js";
import type { KavlingEntity } from "../entities/Kavling.js";
import type {
  CreateKavlingDTO,
  UpdateKavlingDTO,
  KavlingFilterDTO,
  KavlingPengeluaranExportRow,
} from "../dtos/KavlingDTO.js";
import type { OffsetPaginatedData } from "../../types/response.js";
import { NotFoundError } from "../errors/NotFoundError.js";
import { ConflictError } from "../errors/ConflictError.js";
import { KavlingMapper } from "../../infrastructure/mapper/KavlingMapper.js";

const kavlingInclude = {
  perumahan: true,
  rekeningTujuan: true,
  sertifikatTanahTambahan: { orderBy: { urutan: "asc" as const } },
} satisfies Prisma.KavlingInclude;

export class KavlingRepository implements IKavlingRepository {
  constructor(private readonly db: PrismaClient) {}

  private buildWhere(filters?: KavlingFilterDTO): Prisma.KavlingWhereInput {
    const where: Prisma.KavlingWhereInput = {};
    if (filters?.perumahanId) where.perumahanId = filters.perumahanId;
    if (filters?.status) where.status = filters.status;
    if (filters?.jenisKavling) where.jenisKavling = filters.jenisKavling;
    if (filters?.search) {
      where.OR = [
        { blok: { contains: filters.search } },
        { nomorUnit: { contains: filters.search } },
        { namaTipe: { contains: filters.search } },
      ];
    }
    return where;
  }

  private buildOrderBy(
    filters?: KavlingFilterDTO,
  ): Prisma.KavlingOrderByWithRelationInput[] {
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
    return orderByClause;
  }
  async create(data: CreateKavlingDTO): Promise<KavlingEntity> {
    try {
      const existing = await this.db.kavling.findFirst({
        where: {
          perumahanId: data.perumahanId,
          blok: data.blok,
          nomorUnit: data.nomorUnit,
        },
      });
      if (existing) {
        throw new ConflictError(
          `Kavling Blok ${data.blok} Nomor ${data.nomorUnit} sudah terdaftar di perumahan ini.`,
        );
      }
      const createData: Prisma.KavlingUncheckedCreateInput = {
        perumahanId: data.perumahanId,
        blok: data.blok,
        nomorUnit: data.nomorUnit,
        namaTipe: data.namaTipe,
        luasBangunan: data.luasBangunan,
        luasTanah: data.luasTanah,
        hargaDasar: data.hargaDasar,
        rekeningTujuanId:
          data.rekeningTujuanId && data.rekeningTujuanId > 0
            ? data.rekeningTujuanId
            : null,
        filePbg: data.filePbg ?? null,
        fileSertifikatTanah: data.fileSertifikatTanah ?? null,
        fileNopPbb: data.fileNopPbb ?? null,
      };
      if (data.jenisKavling !== undefined) {
        createData.jenisKavling = data.jenisKavling;
      }
      if (data.status !== undefined) {
        createData.status = data.status;
      }
      if (data.jumlahSertifikatTanah !== undefined) {
        createData.jumlahSertifikatTanah = data.jumlahSertifikatTanah;
      }
      const result = await this.db.kavling.create({
        data: createData,
        include: kavlingInclude,
      });
      return KavlingMapper.toDomain(result);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictError(
          `Kavling Blok ${data.blok} Nomor ${data.nomorUnit} sudah terdaftar di perumahan ini.`,
        );
      }
      console.error(error);
      throw error;
    }
  }
  async findById(id: number): Promise<KavlingEntity | null> {
    const result = await this.db.kavling.findUnique({
      where: { id },
      include: kavlingInclude,
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
    if (data.jenisKavling !== undefined) updateData.jenisKavling = data.jenisKavling;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.rekeningTujuanId !== undefined) {
      updateData.rekeningTujuanId =
        data.rekeningTujuanId && data.rekeningTujuanId > 0
          ? data.rekeningTujuanId
          : null;
    }
    if (data.filePbg !== undefined) updateData.filePbg = data.filePbg ?? null;
    if (data.fileSertifikatTanah !== undefined)
      updateData.fileSertifikatTanah = data.fileSertifikatTanah ?? null;
    if (data.fileNopPbb !== undefined)
      updateData.fileNopPbb = data.fileNopPbb ?? null;
    if (data.jumlahSertifikatTanah !== undefined) {
      updateData.jumlahSertifikatTanah = data.jumlahSertifikatTanah;
    }

    try {
      const result = await this.db.kavling.update({
        where: { id },
        data: updateData,
        include: kavlingInclude,
      });
      return KavlingMapper.toDomain(result);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictError(
          "Gagal memperbarui: Kombinasi Blok dan Nomor Unit tersebut sudah digunakan oleh kavling lain.",
        );
      }
      throw error;
    }
  }
  async findAll(filters?: KavlingFilterDTO): Promise<KavlingEntity[]> {
    const where = this.buildWhere(filters);
    const orderBy = this.buildOrderBy(filters);
    const items = await this.db.kavling.findMany({
      where,
      orderBy,
      include: kavlingInclude,
    });
    return items.map((item) => KavlingMapper.toDomain(item));
  }

  async findAllForPengeluaranExport(
    filters?: KavlingFilterDTO,
  ): Promise<KavlingPengeluaranExportRow[]> {
    const where = this.buildWhere(filters);
    const orderBy = this.buildOrderBy(filters);
    const items = await this.db.kavling.findMany({
      where,
      orderBy,
      select: {
        blok: true,
        nomorUnit: true,
        luasBangunan: true,
        luasTanah: true,
        penjualan: {
          where: { status: { not: "BATAL" } },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            progressPenjualan: {
              select: {
                nilaiAjb: true,
                biayaBphtb: true,
                biayaPph: true,
              },
            },
            detailKavlingPajak: {
              select: { biayaNotaris: true },
            },
            agent: {
              select: { feeMarketingPct: true },
            },
          },
        },
      },
    });

    return items.map((item) => {
      const penjualan = item.penjualan[0];
      const progress = penjualan?.progressPenjualan;
      const pajak = penjualan?.detailKavlingPajak;
      const nilaiAjb = progress?.nilaiAjb ? Number(progress.nilaiAjb) : null;
      const feeMarketingPct = penjualan?.agent?.feeMarketingPct
        ? Number(penjualan.agent.feeMarketingPct)
        : 0;
      const feeMarketing =
        nilaiAjb && nilaiAjb > 0 && feeMarketingPct > 0
          ? nilaiAjb * (feeMarketingPct / 100)
          : null;

      return {
        blok: item.blok,
        nomorUnit: item.nomorUnit,
        luasBangunan: Number(item.luasBangunan),
        luasTanah: Number(item.luasTanah),
        biayaNotaris: pajak?.biayaNotaris ? Number(pajak.biayaNotaris) : null,
        biayaBphtb: progress?.biayaBphtb ? Number(progress.biayaBphtb) : null,
        biayaPph: progress?.biayaPph ? Number(progress.biayaPph) : null,
        nilaiAjb,
        feeMarketing,
      };
    });
  }

  async findWithCursorPagination(
    page: number,
    limit: number,
    filters?: KavlingFilterDTO,
  ): Promise<OffsetPaginatedData<KavlingEntity>> {
    const where = this.buildWhere(filters);
    const orderByClause = this.buildOrderBy(filters);
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
          ...kavlingInclude,
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

  async upsertSertifikatTambahanDocument(
    kavlingId: number,
    urutan: number,
    docType: "filePbg" | "fileSertifikatTanah" | "fileNopPbb",
    fileUrl: string,
  ): Promise<KavlingEntity> {
    const existing = await this.findById(kavlingId);
    if (!existing) throw new NotFoundError("Kavling tidak ditemukan");
    if (urutan < 2 || urutan > existing.jumlahSertifikatTanah) {
      throw new ConflictError(
        `Urutan sertifikat ${urutan} tidak valid untuk kavling ini (jumlah sertifikat: ${existing.jumlahSertifikatTanah}).`,
      );
    }

    await this.db.kavlingSertifikatTanahTambahan.upsert({
      where: {
        kavlingId_urutan: { kavlingId, urutan },
      },
      create: {
        kavlingId,
        urutan,
        [docType]: fileUrl,
      },
      update: {
        [docType]: fileUrl,
      },
    });

    const updated = await this.findById(kavlingId);
    if (!updated) throw new NotFoundError("Kavling tidak ditemukan");
    return updated;
  }
}
