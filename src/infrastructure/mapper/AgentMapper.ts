import type { Prisma } from "@prisma/client";
import type { AgentEntity } from "../../domain/entities/Agent.js";
import { resolveAgentCommercialProfile } from "../../domain/agent/agentCommercialProfile.js";

export type AgentWithRelations = Prisma.AgentGetPayload<{
  include: {
    perusahaanAgent: true;
    pics: true;
    penjualan: {
      select: {
        id: true;
        noTransaksi: true;
        tanggal: true;
        hargaJual: true;
        status: true;
        bookingFeeLunasBatal: true;
        customer: { select: { nama: true } };
        kavling: {
          select: {
            blok: true;
            nomorUnit: true;
            perumahan: { select: { nama: true } };
          };
        };
      };
    };
  };
}>;

export class AgentMapper {
  static toDomain(prismaAgent: AgentWithRelations): AgentEntity {
    const commercial = resolveAgentCommercialProfile(prismaAgent);

    return {
      id: prismaAgent.id,
      userId: prismaAgent.userId ?? null,
      nik: prismaAgent.nik,
      kodeSales: prismaAgent.kodeSales,
      nama: prismaAgent.nama,
      alamat: prismaAgent.alamat,
      noHp: prismaAgent.noHp,
      email: prismaAgent.email,
      status: prismaAgent.status,
      type: prismaAgent.type,
      namaBank: commercial.namaBank,
      noRekening: commercial.noRekening,
      atasNamaRekening: commercial.atasNamaRekening,
      feeMarketingPct: commercial.feeMarketingPct,
      feeClosingNominal: commercial.feeClosingNominal,
      potonganPph: commercial.potonganPph,
      isPkp: commercial.isPkp,
      isInHouse: prismaAgent.isInHouse ?? false,
      fileKtp: prismaAgent.fileKtp ?? null,
      fileNpwp: prismaAgent.fileNpwp ?? null,
      kwitansiBookingFee: prismaAgent.kwitansiBookingFee ?? null,
      fileSuratPernyataan: prismaAgent.fileSuratPernyataan ?? null,
      defaultSuratPernyataan: prismaAgent.defaultSuratPernyataan ?? null,
      fileSuratKeterangan: prismaAgent.fileSuratKeterangan ?? null,
      fileKtpDirektur: prismaAgent.fileKtpDirektur ?? null,
      fileNpwpPerusahaan: prismaAgent.fileNpwpPerusahaan ?? null,
      hasAccount: prismaAgent.userId !== null,
      createdAt: prismaAgent.createdAt,
      updatedAt: prismaAgent.updatedAt,
      pics: prismaAgent.pics.map((pic) => ({
        id: pic.id,
        agentId: pic.agentId,
        nama: pic.nama,
        noHp: pic.noHp,
        alamat: pic.alamat,
        createdAt: pic.createdAt,
        updatedAt: pic.updatedAt,
      })),
      perusahaanAgentId: prismaAgent.perusahaanAgentId ?? null,
      perusahaanAgent: prismaAgent.perusahaanAgent
        ? {
            id: prismaAgent.perusahaanAgent.id,
            nama: prismaAgent.perusahaanAgent.nama,
            npwp: prismaAgent.perusahaanAgent.npwp ?? null,
            namaBank: prismaAgent.perusahaanAgent.namaBank ?? null,
            noRekening: prismaAgent.perusahaanAgent.noRekening ?? null,
            atasNamaRekening: prismaAgent.perusahaanAgent.atasNamaRekening ?? null,
            feeMarketingPct:
              prismaAgent.perusahaanAgent.feeMarketingPct != null
                ? Number(prismaAgent.perusahaanAgent.feeMarketingPct)
                : null,
            feeClosingNominal:
              prismaAgent.perusahaanAgent.feeClosingNominal != null
                ? Number(prismaAgent.perusahaanAgent.feeClosingNominal)
                : null,
            potonganPph:
              prismaAgent.perusahaanAgent.potonganPph != null
                ? Number(prismaAgent.perusahaanAgent.potonganPph)
                : null,
            isPkp: prismaAgent.perusahaanAgent.isPkp ?? false,
            akte: prismaAgent.perusahaanAgent.akte ?? null,
          }
        : null,

      penjualan: prismaAgent.penjualan
        ? prismaAgent.penjualan
            .filter(
              (p) => p.status !== "BATAL" || p.bookingFeeLunasBatal,
            )
            .map((p) => ({
              id: p.id,
              noTransaksi: p.noTransaksi,
              tanggal: p.tanggal,
              hargaJual: Number(p.hargaJual),
              status: p.status,
              customer: p.customer ? { nama: p.customer.nama } : null,
              kavling: p.kavling
                ? {
                    blok: p.kavling.blok,
                    nomorUnit: p.kavling.nomorUnit,
                    perumahan: p.kavling.perumahan
                      ? { nama: p.kavling.perumahan.nama }
                      : null,
                  }
                : null,
            }))
        : [],
    };
  }
}
