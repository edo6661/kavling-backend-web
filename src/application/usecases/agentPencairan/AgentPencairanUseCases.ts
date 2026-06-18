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
import {
  calcPencairanSubmit,
  hasAjbComplete,
  hasAkadKreditComplete,
  hasPpjbComplete,
  hasSp3kComplete,
  sumSudahDiajukan,
  type PencairanKomponen,
} from "../../../domain/agent/agentPencairanCalc.js";
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
    if (!data.includeClosing && !data.includeMarketing) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "Pilih minimal satu komponen pencairan (closing fee atau komisi marketing).",
      );
    }

    const existingList = await this.repo.findByFeeAgentId(data.feeAgentId);
    const sudah = sumSudahDiajukan(existingList);

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
              select: {
                nilaiAjb: true,
                filePpjb: true,
                fileAjb: true,
                fileSp3k: true,
                fileSuratPernyataanAkadKredit: true,
              },
            },
          },
        },
      },
    });

    if (!feeAgent) {
      throw new NotFoundError("Data fee agent tidak ditemukan");
    }

    const nilaiAjb = feeAgent.penjualan.progressPenjualan?.nilaiAjb
      ? Number(feeAgent.penjualan.progressPenjualan.nilaiAjb)
      : 0;

    const calcCtx = {
      penjualanStatus: feeAgent.penjualan.status,
      caraPembayaran: feeAgent.penjualan.caraPembayaran,
      hargaJual: feeAgent.penjualan.hargaJual
        ? Number(feeAgent.penjualan.hargaJual)
        : 0,
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
      hasPpjb: hasPpjbComplete(feeAgent.penjualan.progressPenjualan),
      hasSp3k: hasSp3kComplete(feeAgent.penjualan.progressPenjualan),
      hasAjb: hasAjbComplete(feeAgent.penjualan.progressPenjualan),
      hasAkadKredit: hasAkadKreditComplete(
        feeAgent.penjualan.progressPenjualan,
      ),
    };

    const selected: PencairanKomponen[] = [];
    if (data.includeClosing) selected.push("closing");
    if (data.includeMarketing) selected.push("marketing");

    let amounts;
    try {
      amounts = calcPencairanSubmit(calcCtx, sudah, selected);
    } catch (err) {
      const code = err instanceof Error ? err.message : "";
      if (code === "AJB_ALREADY_SUBMITTED" || code === "PPJB_ALREADY_SUBMITTED") {
        throw new ConflictError("Komponen pencairan ini sudah pernah diajukan.");
      }
      if (code === "CLOSING_NOT_ELIGIBLE") {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          "Closing fee belum memenuhi syarat pencairan.",
        );
      }
      if (code === "MARKETING_NOT_ELIGIBLE") {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          "Komisi marketing belum memenuhi syarat pencairan.",
        );
      }
      if (code === "TOTAL_NOT_POSITIVE") {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          "Nominal pencairan setelah PPh tidak valid.",
        );
      }
      throw err;
    }

    return await this.repo.create({
      feeAgentId: data.feeAgentId,
      penjualanId: feeAgent.penjualanId,
      agentId: feeAgent.agentId,
      tahap: amounts.tahap,
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
