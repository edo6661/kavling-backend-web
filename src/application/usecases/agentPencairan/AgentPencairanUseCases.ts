import type { PrismaClient } from "@prisma/client";
import type { IAgentPencairanRepository } from "../../../domain/repositories/IAgentPencairanRepo.js";
import type {
  AgentPencairanFilterDTO,
  BayarAgentPencairanDTO,
  CreateAgentPencairanDTO,
  SetAgentBsiCmsDilaporkanDTO,
} from "../../../domain/dtos/AgentPencairanDTO.js";
import type {
  AgentPencairanEntity,
  AgentPencairanTahap,
} from "../../../domain/entities/AgentPencairan.js";
import type { OffsetPaginatedData } from "../../../types/response.js";
import {
  calcAgentPencairanAmounts,
  determineNextPencairanTahap,
  hasPpjbComplete,
  hasSp3kComplete,
  isBookingFeePaid,
  isCashPayment,
  isPenjualanBatal,
  isPencairanTahapEligible,
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
    const existingList = await this.repo.findByFeeAgentId(data.feeAgentId);
    const existingTahaps = existingList.map((p) => p.tahap);

    if (existingTahaps.includes(data.tahap)) {
      throw new ConflictError(
        `Pencairan tahap ${data.tahap} untuk penjualan ini sudah pernah diajukan.`,
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
              select: { nilaiAjb: true, filePpjb: true, fileSp3k: true },
            },
          },
        },
      },
    });

    if (!feeAgent) {
      throw new NotFoundError("Data fee agent tidak ditemukan");
    }

    const penjualanStatus = feeAgent.penjualan.status;
    const isBatal = isPenjualanBatal(penjualanStatus);

    const nilaiAjb = feeAgent.penjualan.progressPenjualan?.nilaiAjb
      ? Number(feeAgent.penjualan.progressPenjualan.nilaiAjb)
      : 0;
    const hargaJual = feeAgent.penjualan.hargaJual
      ? Number(feeAgent.penjualan.hargaJual)
      : 0;
    const caraPembayaran = feeAgent.penjualan.caraPembayaran;
    const isCash = isCashPayment(caraPembayaran);
    const hasPpjb = hasPpjbComplete(feeAgent.penjualan.progressPenjualan);
    const hasSp3k = hasSp3kComplete(feeAgent.penjualan.progressPenjualan);
    const bookingPaid = isBookingFeePaid(feeAgent.penjualan.tagihan);
    const ppjbRecord = existingList.find((p) => p.tahap === "PPJB");
    const ppjbSudahDibayar = ppjbRecord?.status === "SUDAH_DIBAYAR";

    const nextTahap = determineNextPencairanTahap({
      penjualanStatus,
      isCash,
      hasPpjb,
      hasSp3k,
      hasAjb: nilaiAjb > 0,
      bookingPaid,
      existingTahaps,
      ppjbSudahDibayar,
    });

    if (!nextTahap || nextTahap !== data.tahap) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        isBatal
          ? "Pencairan closing fee untuk transaksi batal belum memenuhi syarat (booking fee harus sudah lunas)."
          : data.tahap === "PPJB"
            ? isCash
              ? "Tahap PPJB belum memenuhi syarat (cash, booking fee lunas, dokumen PPJB sudah diunggah)."
              : "Tahap SP3K belum memenuhi syarat (KPR, booking fee lunas, dokumen SP3K sudah diunggah)."
            : isCash
              ? "Tahap AJB belum memenuhi syarat (nilai AJB ada & pencairan PPJB sudah dibayar)."
              : "Tahap AJB belum memenuhi syarat (nilai AJB ada & pencairan closing fee sudah dibayar).",
      );
    }

    const calcInput = {
      penjualanStatus,
      caraPembayaran,
      hargaJual,
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
      hasPpjb,
      hasSp3k,
      ppjbSudahDibayar,
    };

    if (!isPencairanTahapEligible(data.tahap, calcInput)) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "Nominal pencairan untuk tahap ini belum tersedia.",
      );
    }

    const amounts = calcAgentPencairanAmounts({
      ...calcInput,
      tahap: data.tahap,
    });

    return await this.repo.create({
      feeAgentId: data.feeAgentId,
      penjualanId: feeAgent.penjualanId,
      agentId: feeAgent.agentId,
      tahap: data.tahap,
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
