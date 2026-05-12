import type { Prisma } from "@prisma/client";
import type { AgentEntity } from "../../domain/entities/Agent.js";

export type AgentWithRelations = Prisma.AgentGetPayload<{
  include: {
    pics: true;
    penjualan: {
      select: {
        id: true;
        noTransaksi: true;
        tanggal: true;
        hargaJual: true;
        status: true;
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
      feeMarketingPct: prismaAgent.feeMarketingPct
        ? Number(prismaAgent.feeMarketingPct)
        : null,
      potonganPph: prismaAgent.potonganPph
        ? Number(prismaAgent.potonganPph)
        : null,
      fileKtp: prismaAgent.fileKtp ?? null,
      fileNpwp: prismaAgent.fileNpwp ?? null,
      kwitansiBookingFee: prismaAgent.kwitansiBookingFee ?? null,
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

      penjualan: prismaAgent.penjualan
        ? prismaAgent.penjualan
            .filter((p) => p.status !== "BATAL")
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
