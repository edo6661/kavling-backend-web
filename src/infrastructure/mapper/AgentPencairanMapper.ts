import type { Prisma } from "@prisma/client";
import type { AgentPencairanEntity } from "../../domain/entities/AgentPencairan.js";
import { resolveAgentCommercialProfile } from "../../domain/agent/agentCommercialProfile.js";

export const agentPencairanInclude = {
  diajukanOleh: { select: { id: true, username: true } },
  dibayarOleh: { select: { id: true, username: true } },
  agent: {
    select: {
      id: true,
      nama: true,
      type: true,
      namaBank: true,
      noRekening: true,
      atasNamaRekening: true,
      perusahaanAgent: {
        select: {
          namaBank: true,
          noRekening: true,
          atasNamaRekening: true,
        },
      },
    },
  },
  penjualan: {
    select: {
      id: true,
      noTransaksi: true,
      customer: { select: { id: true, nama: true } },
      kavling: {
        select: {
          blok: true,
          nomorUnit: true,
          perumahan: { select: { nama: true } },
        },
      },
    },
  },
} satisfies Prisma.AgentPencairanInclude;

export type AgentPencairanWithRelations = Prisma.AgentPencairanGetPayload<{
  include: typeof agentPencairanInclude;
}>;

export class AgentPencairanMapper {
  static readonly include = agentPencairanInclude;

  static toDomain(row: AgentPencairanWithRelations): AgentPencairanEntity {
    const commercial = resolveAgentCommercialProfile(row.agent);

    return {
      id: row.id,
      feeAgentId: row.feeAgentId,
      penjualanId: row.penjualanId,
      agentId: row.agentId,
      tahap: row.tahap,
      closingNominal: Number(row.closingNominal),
      marketingNominal: Number(row.marketingNominal),
      potonganPph: Number(row.potonganPph),
      totalNominal: Number(row.totalNominal),
      status: row.status,
      fileInvoice: row.fileInvoice,
      buktiPembayaran: row.buktiPembayaran,
      tanggalPembayaran: row.tanggalPembayaran,
      bsiCmsDilaporkan: row.bsiCmsDilaporkan,
      bsiCmsDilaporkanAt: row.bsiCmsDilaporkanAt,
      diajukanOlehId: row.diajukanOlehId,
      dibayarOlehId: row.dibayarOlehId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      diajukanOleh: row.diajukanOleh,
      dibayarOleh: row.dibayarOleh,
      agent: {
        id: row.agent.id,
        nama: row.agent.nama,
        namaBank: commercial.namaBank,
        noRekening: commercial.noRekening,
        atasNamaRekening: commercial.atasNamaRekening,
      },
      penjualan: row.penjualan,
    };
  }
}
