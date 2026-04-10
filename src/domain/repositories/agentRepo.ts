import type { Prisma } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";
import type { IAgentRepository } from "./IAgentRepo.js";
import type { AgentEntity } from "../entities/Agent.js";
import type {
  CreateAgentDTO,
  UpdateAgentDTO,
  AgentFilterDTO,
} from "../dtos/AgentDTO.js";
import type { CursorPaginatedData } from "../../types/response.js";
import { NotFoundError } from "../errors/NotFoundError.js";
import { ConflictError } from "../errors/ConflictError.js";
import { AgentMapper } from "../../infrastructure/mapper/AgentMapper.js";

export class AgentRepository implements IAgentRepository {
  constructor(private readonly db: PrismaClient) {}

  async create(data: CreateAgentDTO): Promise<AgentEntity> {
    const checkDuplicate = await this.db.agent.findFirst({
      where: { nik: data.nik },
    });

    if (checkDuplicate) {
      throw new ConflictError("NIK Agent sudah terdaftar");
    }

    const createData: Prisma.AgentCreateInput = {
      nik: data.nik,
      nama: data.nama,
      noHp: data.noHp,
      email: data.email ?? null,
      alamat: data.alamat ?? null,
    };

    if (data.status) {
      createData.status = data.status;
    }

    if (data.pics && data.pics.length > 0) {
      createData.pics = {
        create: data.pics.map((p) => ({
          nama: p.nama,
          noHp: p.noHp,
          alamat: p.alamat ?? null,
        })),
      };
    }

    const result = await this.db.agent.create({
      data: createData,
      include: { pics: true },
    });

    return AgentMapper.toDomain(result);
  }

  async findById(id: number): Promise<AgentEntity | null> {
    const result = await this.db.agent.findUnique({
      where: { id },
      include: { pics: true },
    });
    if (!result) return null;
    return AgentMapper.toDomain(result);
  }

  async update(id: number, data: UpdateAgentDTO): Promise<AgentEntity> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundError("Agent tidak ditemukan");
    }

    const updateData: Prisma.AgentUpdateInput = {};

    if (data.nik !== undefined) updateData.nik = data.nik;
    if (data.nama !== undefined) updateData.nama = data.nama;
    if (data.noHp !== undefined) updateData.noHp = data.noHp;
    if (data.email !== undefined) updateData.email = data.email ?? null;
    if (data.alamat !== undefined) updateData.alamat = data.alamat ?? null;
    if (data.status !== undefined) updateData.status = data.status;

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

    const result = await this.db.agent.update({
      where: { id },
      data: updateData,
      include: { pics: true },
    });

    return AgentMapper.toDomain(result);
  }

  async findWithCursorPagination(
    limit: number,
    cursor?: number,
    filters?: AgentFilterDTO,
  ): Promise<CursorPaginatedData<AgentEntity>> {
    const where: Prisma.AgentWhereInput = {};

    if (filters?.search) {
      where.OR = [
        { nama: { contains: filters.search } },
        { nik: { contains: filters.search } },
      ];
    }

    const items = await this.db.agent.findMany({
      take: limit + 1,
      ...(cursor && { skip: 1, cursor: { id: cursor } }),
      where,
      orderBy: [{ id: "desc" }],

      include: {
        pics: true,
        penjualan: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            noTransaksi: true,
            tanggal: true,
            hargaJual: true,
            status: true,
            customer: { select: { nama: true } },
            kavling: {
              select: {
                blok: true,
                nomorUnit: true,
                perumahan: { select: { nama: true } },
              },
            },
          },
        },
      },
    });

    let hasNextPage = false;
    if (items.length > limit) {
      hasNextPage = true;
      items.pop();
    }

    return {
      items: items.map((item) => AgentMapper.toDomain(item)),
      meta: {
        nextCursor: hasNextPage ? (items.at(-1)?.id ?? null) : null,
        hasNextPage,
      },
    };
  }

  async delete(id: number): Promise<void> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundError("Agent tidak ditemukan");
    }

    await this.db.agent.delete({ where: { id } });
  }
}
