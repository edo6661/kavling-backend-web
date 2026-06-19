import type { PerusahaanAgent as PrismaPerusahaanAgent } from "@prisma/client";
import type { PerusahaanAgentEntity } from "../../domain/entities/PerusahaanAgent.js";

export class PerusahaanAgentMapper {
  static toDomain(prismaData: PrismaPerusahaanAgent): PerusahaanAgentEntity {
    return {
      id: prismaData.id,
      nama: prismaData.nama,
      npwp: prismaData.npwp,
      namaBank: prismaData.namaBank,
      noRekening: prismaData.noRekening,
      atasNamaRekening: prismaData.atasNamaRekening,
      feeMarketingPct: prismaData.feeMarketingPct
        ? Number(prismaData.feeMarketingPct)
        : null,
      feeClosingNominal: prismaData.feeClosingNominal
        ? Number(prismaData.feeClosingNominal)
        : null,
      potonganPph: prismaData.potonganPph
        ? Number(prismaData.potonganPph)
        : null,
      isPkp: prismaData.isPkp,
      akte: prismaData.akte,
      createdAt: prismaData.createdAt,
      updatedAt: prismaData.updatedAt,
    };
  }
}
