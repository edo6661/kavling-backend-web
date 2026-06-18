import type { PrismaClient } from "@prisma/client";
import type { IAgentPencairanRepository } from "../../../domain/repositories/IAgentPencairanRepo.js";
import type {
  AgentPencairanFilterDTO,
  BayarAgentPencairanDTO,
  CreateAgentPencairanDTO,
  SetAgentBsiCmsDilaporkanDTO,
} from "../../../domain/dtos/AgentPencairanDTO.js";
import type { AgentPencairanEntity } from "../../../domain/entities/AgentPencairan.js";
import type { OffsetPaginatedData } from "../../../types/response.js";
import { calcAgentPencairanAmounts } from "../../../domain/agent/agentPencairanCalc.js";
import { NotFoundError } from "../../../domain/errors/NotFoundError.js";
import { AppError } from "../../../domain/errors/AppError.js";
import { ConflictError } from "../../../domain/errors/ConflictError.js";
import { StatusCodes } from "http-status-codes";
import type { CloudinaryService } from "../../../infrastructure/external/CloudinaryService.js";

export class GetAgentPencairanPaginatedUseCase {
  constructor(private readonly repo: IAgentPencairanRepository) {}

  async execute(
    page: number,
    limit: number,
    filters?: AgentPencairanFilterDTO,
  ): Promise<OffsetPaginatedData<AgentPencairanEntity>> {
    return await this.repo.findPaginated(page, limit, filters);
  }
}

export class AjukanAgentPencairanUseCase {
  constructor(
    private readonly repo: IAgentPencairanRepository,
    private readonly db: PrismaClient,
  ) {}

  async execute(
    data: CreateAgentPencairanDTO,
  ): Promise<AgentPencairanEntity> {
    const existing = await this.repo.findByFeeAgentId(data.feeAgentId);
    if (existing) {
      throw new ConflictError(
        "Pencairan untuk penjualan ini sudah pernah diajukan.",
      );
    }

    const feeAgent = await this.db.feeAgent.findUnique({
      where: { id: data.feeAgentId },
      include: {
        agent: true,
        penjualan: {
          include: {
            tagihan: {
              select: { tujuan: true, pembayaran: true, status: true },
            },
            progressPenjualan: {
              select: { nilaiAjb: true },
            },
          },
        },
      },
    });

    if (!feeAgent) {
      throw new NotFoundError("Data fee agent tidak ditemukan");
    }

    if (feeAgent.penjualan.status === "BATAL") {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "Tidak dapat mengajukan pencairan untuk transaksi yang dibatalkan.",
      );
    }

    const nilaiAjb = feeAgent.penjualan.progressPenjualan?.nilaiAjb
      ? Number(feeAgent.penjualan.progressPenjualan.nilaiAjb)
      : 0;

    const amounts = calcAgentPencairanAmounts({
      agent: {
        feeMarketingPct: feeAgent.agent.feeMarketingPct
          ? Number(feeAgent.agent.feeMarketingPct)
          : null,
        feeClosingNominal: feeAgent.agent.feeClosingNominal
          ? Number(feeAgent.agent.feeClosingNominal)
          : null,
        potonganPph: feeAgent.agent.potonganPph
          ? Number(feeAgent.agent.potonganPph)
          : null,
      },
      feeAgent: {
        closingNominal: feeAgent.closingNominal
          ? Number(feeAgent.closingNominal)
          : null,
      },
      nilaiAjb,
      tagihanList: feeAgent.penjualan.tagihan,
    });

    if (!amounts.eligible) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "Belum memenuhi syarat pencairan. Customer harus sudah bayar booking fee atau sudah AJB.",
      );
    }

    return await this.repo.create({
      feeAgentId: data.feeAgentId,
      penjualanId: feeAgent.penjualanId,
      agentId: feeAgent.agentId,
      diajukanOlehId: data.diajukanOlehId,
      closingNominal: amounts.closingNominal,
      marketingNominal: amounts.marketingNominal,
      potonganPph: amounts.potonganPph,
      totalNominal: amounts.totalNominal,
    });
  }
}

export class BayarAgentPencairanUseCase {
  constructor(
    private readonly repo: IAgentPencairanRepository,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async execute(
    id: number,
    dibayarOlehId: number,
    fileBuffer: Buffer,
    tanggalPembayaran?: Date,
  ): Promise<AgentPencairanEntity> {
    if (!fileBuffer?.length) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Bukti pembayaran wajib diunggah");
    }

    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new NotFoundError("Pengajuan pencairan agent tidak ditemukan");
    }

    if (existing.status === "SUDAH_DIBAYAR") {
      throw new AppError(StatusCodes.BAD_REQUEST, "Pencairan ini sudah diproses.");
    }

    const buktiPembayaran = await this.cloudinary.uploadFile(
      fileBuffer,
      "bumantara/agent-pencairan",
    );

    const payDto: BayarAgentPencairanDTO = {
      id,
      dibayarOlehId,
      buktiPembayaran,
    };
    if (tanggalPembayaran) payDto.tanggalPembayaran = tanggalPembayaran;

    return await this.repo.markAsPaid(payDto);
  }
}

export class SetAgentBsiCmsDilaporkanUseCase {
  constructor(private readonly repo: IAgentPencairanRepository) {}

  async execute(
    data: SetAgentBsiCmsDilaporkanDTO,
  ): Promise<AgentPencairanEntity[]> {
    if (data.ids.length === 0) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Pilih minimal satu pencairan.");
    }

    const uniqueIds = [...new Set(data.ids)];
    const results = await this.repo.setBsiCmsDilaporkan({
      ids: uniqueIds,
      dilaporkan: data.dilaporkan,
    });

    if (results.length !== uniqueIds.length) {
      throw new NotFoundError("Sebagian pencairan agent tidak ditemukan.");
    }

    return results;
  }
}
