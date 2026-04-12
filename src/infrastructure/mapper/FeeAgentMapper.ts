import type {
  FeeAgent,
  Agent,
  Penjualan,
  Customer,
  Kavling,
  Perumahan,
} from "@prisma/client";
import type { FeeAgentResponseDTO } from "../../domain/dtos/FeeAgentDTO.js";

// Kita buat tipe eksplisit untuk menghindari Unsafe member access
export type FeeAgentWithRelations = FeeAgent & {
  agent: Pick<Agent, "nama">;
  penjualan: Penjualan & {
    customer: Pick<Customer, "nama">;
    kavling: Kavling & {
      perumahan: Pick<Perumahan, "nama">;
    };
  };
};

export class FeeAgentMapper {
  static toDomain(prismaFee: FeeAgentWithRelations): FeeAgentResponseDTO {
    return {
      id: prismaFee.id,
      agentId: prismaFee.agentId,
      namaAgent: prismaFee.agent.nama,
      penjualanId: prismaFee.penjualanId,
      noTransaksi: prismaFee.penjualan.noTransaksi,
      namaCustomer: prismaFee.penjualan.customer.nama,
      kavling: `${prismaFee.penjualan.kavling.perumahan.nama} Blok ${prismaFee.penjualan.kavling.blok}-${prismaFee.penjualan.kavling.nomorUnit}`,
      bookingNominal: prismaFee.bookingNominal
        ? Number(prismaFee.bookingNominal)
        : null,
      bookingTanggal: prismaFee.bookingTanggal,
      bookingBukti: prismaFee.bookingBukti,
      closingNominal: prismaFee.closingNominal
        ? Number(prismaFee.closingNominal)
        : null,
      closingTanggal: prismaFee.closingTanggal,
      closingBukti: prismaFee.closingBukti,
      marketingNominal: prismaFee.marketingNominal
        ? Number(prismaFee.marketingNominal)
        : null,
      marketingTanggal: prismaFee.marketingTanggal,
      marketingBukti: prismaFee.marketingBukti,
      createdAt: prismaFee.createdAt,
      updatedAt: prismaFee.updatedAt,
    };
  }
}
