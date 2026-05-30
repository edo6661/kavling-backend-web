import type { Prisma } from "@prisma/client";
import type { BankKprPembayaranEntity } from "../../domain/entities/BankKprPembayaran.js";

export const bankKprPembayaranInclude = {
  dibayarOleh: { select: { id: true, username: true } },
  penjualan: {
    select: {
      id: true,
      noTransaksi: true,
      bank: true,
      bankKprNamaRekening: true,
      bankKprAtasNamaRekening: true,
      bankKprNoRekening: true,
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
} satisfies Prisma.BankKprPembayaranInclude;

export type BankKprPembayaranWithRelations = Prisma.BankKprPembayaranGetPayload<{
  include: typeof bankKprPembayaranInclude;
}>;

export class BankKprPembayaranMapper {
  static readonly include = bankKprPembayaranInclude;

  static toDomain(row: BankKprPembayaranWithRelations): BankKprPembayaranEntity {
    const entity: BankKprPembayaranEntity = {
      id: row.id,
      penjualanId: row.penjualanId,
      jenis: row.jenis,
      nominal: Number(row.nominal),
      status: row.status,
      buktiPembayaran: row.buktiPembayaran,
      tanggalPembayaran: row.tanggalPembayaran,
      bsiCmsDilaporkan: row.bsiCmsDilaporkan,
      bsiCmsDilaporkanAt: row.bsiCmsDilaporkanAt,
      dibayarOlehId: row.dibayarOlehId,
      dibayarOleh: row.dibayarOleh,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };

    if (row.penjualan) {
      entity.penjualan = {
        id: row.penjualan.id,
        noTransaksi: row.penjualan.noTransaksi,
        bank: row.penjualan.bank,
        bankKprNamaRekening: row.penjualan.bankKprNamaRekening,
        bankKprAtasNamaRekening: row.penjualan.bankKprAtasNamaRekening,
        bankKprNoRekening: row.penjualan.bankKprNoRekening,
        customer: row.penjualan.customer,
        kavling: row.penjualan.kavling,
      };
    }

    return entity;
  }
}
