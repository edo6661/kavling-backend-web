import { AgentStatus, AgentType, Prisma } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";
import type { IAgentRepository } from "./IAgentRepo.js";
import type { AgentEntity } from "../entities/Agent.js";
import type {
  CreateAgentDTO,
  UpdateAgentDTO,
  AgentFilterDTO,
} from "../dtos/AgentDTO.js";
import type { OffsetPaginatedData } from "../../types/response.js";
import { StatusCodes } from "http-status-codes";
import { NotFoundError } from "../errors/NotFoundError.js";
import { ConflictError } from "../errors/ConflictError.js";
import { AppError } from "../errors/AppError.js";
import { AgentMapper } from "../../infrastructure/mapper/AgentMapper.js";
import { isAgentPerusahaan } from "../agent/agentCommercialProfile.js";

export const IN_HOUSE_FEE_MARKETING_PCT = 0.5;

function applyInHouseCommercialDefaults(
  data: Pick<CreateAgentDTO, "isInHouse" | "feeMarketingPct" | "feeClosingNominal">,
) {
  if (!data.isInHouse) return data;
  return {
    ...data,
    feeMarketingPct: IN_HOUSE_FEE_MARKETING_PCT,
    feeClosingNominal: 0,
  };
}

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
      status: AgentStatus.AKTIF,
    };

    const isPerusahaanCreate =
      isAgentPerusahaan(data.type ?? AgentType.PRIBADI) &&
      data.perusahaanAgentId != null;

    if (!isPerusahaanCreate) {
      createData.namaBank = data.namaBank ?? null;
      createData.noRekening = data.noRekening ?? null;
      createData.atasNamaRekening = data.atasNamaRekening ?? null;
    }

    if (data.status) createData.status = data.status;
    if (data.type) createData.type = data.type;
    if (data.perusahaanAgentId !== undefined) {
      createData.perusahaanAgent = { connect: { id: data.perusahaanAgentId } };
    }

    const isPerusahaan =
      isAgentPerusahaan(data.type ?? AgentType.PRIBADI) &&
      data.perusahaanAgentId != null;

    if (!isPerusahaan) {
      const commercial = applyInHouseCommercialDefaults({
        isInHouse: data.isInHouse,
        feeMarketingPct: data.feeMarketingPct,
        feeClosingNominal: data.feeClosingNominal,
      });
      if (data.isInHouse !== undefined) createData.isInHouse = data.isInHouse;
      if (commercial.feeMarketingPct !== undefined)
        createData.feeMarketingPct = commercial.feeMarketingPct;
      if (commercial.feeClosingNominal !== undefined)
        createData.feeClosingNominal = commercial.feeClosingNominal;
      if (data.potonganPph !== undefined)
        createData.potonganPph = data.potonganPph;
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
      include: {
        pics: true,
        perusahaanAgent: true,
        penjualan: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            noTransaksi: true,
            tanggal: true,
            hargaJual: true,
            status: true,
            bookingFeeLunasBatal: true,
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

    return AgentMapper.toDomain(result);
  }

  async findById(id: number): Promise<AgentEntity | null> {
    const result = await this.db.agent.findUnique({
      where: { id },
      include: {
        pics: true,
        perusahaanAgent: true,
        penjualan: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            noTransaksi: true,
            tanggal: true,
            hargaJual: true,
            status: true,
            bookingFeeLunasBatal: true,
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
    if (!result) return null;
    return AgentMapper.toDomain(result);
  }
  async update(id: number, data: UpdateAgentDTO): Promise<AgentEntity> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundError("Agent tidak ditemukan");
    }

    if (data.nik && data.nik !== existing.nik) {
      const checkDuplicate = await this.db.agent.findFirst({
        where: { nik: data.nik, id: { not: id } },
      });
      if (checkDuplicate) {
        throw new ConflictError("NIK Agent sudah terdaftar");
      }
    }

    const updateData: Prisma.AgentUncheckedUpdateInput = {};

    if (data.userId !== undefined) updateData.userId = data.userId;
    if (data.nik !== undefined) updateData.nik = data.nik;
    if (data.nama !== undefined) updateData.nama = data.nama;
    if (data.noHp !== undefined) updateData.noHp = data.noHp;
    if (data.email !== undefined) updateData.email = data.email ?? null;
    if (data.alamat !== undefined) updateData.alamat = data.alamat ?? null;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.type !== undefined) updateData.type = data.type;
    const nextType = data.type ?? existing.type;
    const nextPerusahaanId =
      data.perusahaanAgentId !== undefined
        ? data.perusahaanAgentId
        : (existing.perusahaanAgentId ?? existing.perusahaanAgent?.id ?? null);
    const isPerusahaan =
      isAgentPerusahaan(nextType) && nextPerusahaanId != null;

    if (data.perusahaanAgentId !== undefined) {
      if (isAgentPerusahaan(nextType)) {
        if (data.perusahaanAgentId == null || data.perusahaanAgentId <= 0) {
          throw new AppError(
            StatusCodes.BAD_REQUEST,
            "Agent perusahaan wajib memilih perusahaan yang valid.",
          );
        }
        const company = await this.db.perusahaanAgent.findUnique({
          where: { id: data.perusahaanAgentId },
          select: { id: true },
        });
        if (!company) {
          throw new AppError(
            StatusCodes.BAD_REQUEST,
            "Perusahaan agent tidak ditemukan. Pilih perusahaan yang masih terdaftar.",
          );
        }
        updateData.perusahaanAgentId = data.perusahaanAgentId;
      } else {
        updateData.perusahaanAgentId = null;
      }
    } else if (isAgentPerusahaan(nextType) && nextPerusahaanId != null) {
      const company = await this.db.perusahaanAgent.findUnique({
        where: { id: nextPerusahaanId },
        select: { id: true },
      });
      if (!company) {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          "Perusahaan agent tidak ditemukan. Pilih perusahaan yang masih terdaftar.",
        );
      }
    }

    if (isPerusahaan) {
      updateData.feeMarketingPct = null;
      updateData.feeClosingNominal = null;
      updateData.potonganPph = null;
      updateData.namaBank = null;
      updateData.noRekening = null;
      updateData.atasNamaRekening = null;
    } else {
      if (data.namaBank !== undefined)
        updateData.namaBank = data.namaBank ?? null;
      if (data.noRekening !== undefined)
        updateData.noRekening = data.noRekening ?? null;
      if (data.atasNamaRekening !== undefined)
        updateData.atasNamaRekening = data.atasNamaRekening ?? null;
      const commercial = applyInHouseCommercialDefaults({
        isInHouse: data.isInHouse,
        feeMarketingPct: data.feeMarketingPct,
        feeClosingNominal: data.feeClosingNominal,
      });
      if (data.isInHouse !== undefined) updateData.isInHouse = data.isInHouse;
      if (commercial.feeMarketingPct !== undefined)
        updateData.feeMarketingPct = commercial.feeMarketingPct ?? null;
      if (commercial.feeClosingNominal !== undefined)
        updateData.feeClosingNominal = commercial.feeClosingNominal ?? null;
      if (data.potonganPph !== undefined)
        updateData.potonganPph = data.potonganPph ?? null;
    }

    if (data.fileKtp !== undefined) updateData.fileKtp = data.fileKtp ?? null;
    if (data.fileNpwp !== undefined)
      updateData.fileNpwp = data.fileNpwp ?? null;
    if (data.kwitansiBookingFee !== undefined)
      updateData.kwitansiBookingFee = data.kwitansiBookingFee ?? null;
    if (data.fileSuratPernyataan !== undefined)
      updateData.fileSuratPernyataan = data.fileSuratPernyataan ?? null;
    if (data.fileSuratKeterangan !== undefined)
      updateData.fileSuratKeterangan = data.fileSuratKeterangan ?? null;
    if (data.fileKtpDirektur !== undefined)
      updateData.fileKtpDirektur = data.fileKtpDirektur ?? null;
    if (data.fileNpwpPerusahaan !== undefined)
      updateData.fileNpwpPerusahaan = data.fileNpwpPerusahaan ?? null;

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

    try {
      const result = await this.db.agent.update({
        where: { id },
        data: updateData,
        include: {
          pics: true,
          perusahaanAgent: true,
          penjualan: {
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              noTransaksi: true,
              tanggal: true,
              hargaJual: true,
              status: true,
              bookingFeeLunasBatal: true,
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

      return AgentMapper.toDomain(result);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictError("NIK Agent sudah terdaftar");
      }
      throw error;
    }
  }

  private agentListInclude = {
    pics: true,
    perusahaanAgent: true,
    penjualan: {
      orderBy: { createdAt: "desc" as const },
      select: {
        id: true,
        noTransaksi: true,
        tanggal: true,
        hargaJual: true,
        status: true,
        bookingFeeLunasBatal: true,
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
  };

  async findWithOffsetPagination(
    page: number,
    limit: number,
    filters?: AgentFilterDTO,
  ): Promise<OffsetPaginatedData<AgentEntity>> {
    const where: Prisma.AgentWhereInput = {};

    if (filters?.search) {
      where.OR = [
        { nama: { contains: filters.search } },
        { nik: { contains: filters.search } },
        { noHp: { contains: filters.search } },
        { email: { contains: filters.search } },
      ];
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.type) {
      where.type = filters.type;
    }

    let orderByClause: Prisma.AgentOrderByWithRelationInput[] = [
      { createdAt: "desc" },
      { id: "asc" },
    ];

    if (filters?.orderBy) {
      const { field, direction } = filters.orderBy;
      const validFields = ["nama", "nik", "createdAt", "status"];
      if (validFields.includes(field)) {
        orderByClause = [{ [field]: direction }, { id: "asc" }];
      }
    }

    const skip = (page - 1) * limit;

    const [rows, totalItems] = await Promise.all([
      this.db.agent.findMany({
        take: limit,
        skip,
        where,
        orderBy: orderByClause,
        include: this.agentListInclude,
      }),
      this.db.agent.count({ where }),
    ]);

    const totalPages = Math.ceil(totalItems / limit) || 1;

    return {
      items: rows.map((item) => AgentMapper.toDomain(item)),
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

  async delete(id: number): Promise<void> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundError("Agent tidak ditemukan");
    }

    await this.db.agent.delete({ where: { id } });
  }
  async findByUserId(userId: number): Promise<AgentEntity | null> {
    const result = await this.db.agent.findFirst({
      where: { userId },
      include: this.agentListInclude,
    });
    if (!result) return null;
    return AgentMapper.toDomain(result);
  }
}
