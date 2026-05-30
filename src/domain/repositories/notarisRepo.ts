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

const notarisIncludeRelations = {
  pics: true,
  detailKavlingPajak: {
    include: {
      penjualan: {
        include: {
          customer: { select: { nama: true } },
          kavling: {
            include: { perumahan: { select: { nama: true } } },
          },
        },
      },
    },
  },
} satisfies Prisma.NotarisInclude;

export class NotarisRepository implements INotarisRepository {
  constructor(private readonly db: PrismaClient) {}

  async create(data: CreateNotarisDTO): Promise<NotarisEntity> {
    const createData: Prisma.NotarisCreateInput = {
      nama: data.nama,
      nomorKtp: data.nomorKtp ?? null,
      nomorIjin: data.nomorIjin ?? null,
      noHp: data.noHp ?? null,
      alamat: data.alamat ?? null,
      namaBank: data.namaBank ?? null,
      noRekening: data.noRekening ?? null,
      atasNamaRekening: data.atasNamaRekening ?? null,
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
      include: notarisIncludeRelations,
    });

    return NotarisMapper.toDomain(result);
  }

  async findById(id: number): Promise<NotarisEntity | null> {
    const result = await this.db.notaris.findUnique({
      where: { id },
      include: notarisIncludeRelations,
    });
    if (!result) return null;
    return NotarisMapper.toDomain(result);
  }

  async update(id: number, data: UpdateNotarisDTO): Promise<NotarisEntity> {
    const existing = await this.findById(id);
    if (!existing) throw new NotFoundError("Notaris tidak ditemukan");

    const updateData: Prisma.NotarisUpdateInput = {};

    if (data.nama !== undefined) updateData.nama = data.nama;
    if (data.nomorKtp !== undefined) updateData.nomorKtp = data.nomorKtp;
    if (data.nomorIjin !== undefined) updateData.nomorIjin = data.nomorIjin;
    if (data.noHp !== undefined) updateData.noHp = data.noHp;
    if (data.alamat !== undefined) updateData.alamat = data.alamat;
    if (data.namaBank !== undefined) updateData.namaBank = data.namaBank;
    if (data.noRekening !== undefined) updateData.noRekening = data.noRekening;
    if (data.atasNamaRekening !== undefined)
      updateData.atasNamaRekening = data.atasNamaRekening;
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
      include: notarisIncludeRelations,
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
      include: notarisIncludeRelations,
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
