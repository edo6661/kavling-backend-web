import type { SprPayment as PrismaSprPayment } from "@prisma/client";
import type { SprPaymentEntity } from "../../domain/entities/SprPayment.js";

export class SprPaymentMapper {
  static toDomain(prismaSprPayment: PrismaSprPayment): SprPaymentEntity {
    return {
      id: prismaSprPayment.id,
      sprId: prismaSprPayment.sprId,
      keterangan: prismaSprPayment.keterangan,
      jatuhTempo: prismaSprPayment.jatuhTempo,

      nilai: prismaSprPayment.nilai.toNumber(),
      statusPembayaran: prismaSprPayment.statusPembayaran,
      buktiTransfer: prismaSprPayment.buktiTransfer,
      createdAt: prismaSprPayment.createdAt,
      updatedAt: prismaSprPayment.updatedAt,
    };
  }
}
