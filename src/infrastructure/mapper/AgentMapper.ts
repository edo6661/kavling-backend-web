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
      nik: prismaAgent.nik,
      kodeSales: prismaAgent.kodeSales,
      nama: prismaAgent.nama,
      alamat: prismaAgent.alamat,
      noHp: prismaAgent.noHp,
      email: prismaAgent.email,
      status: prismaAgent.status,
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
        ? prismaAgent.penjualan.map((p) => ({
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
