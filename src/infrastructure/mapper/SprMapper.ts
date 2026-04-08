import type {
  Spr as PrismaSpr,
  SprPayment as PrismaSprPayment,
  Customer as PrismaCustomer,
  Unit as PrismaUnit,
} from "@prisma/client";
import type { SprEntity } from "../../domain/entities/Spr.js";
import { SprPaymentMapper } from "./SprPaymentMapper.js";
import { CustomerMapper } from "./CustomerMapper.js";
import { UnitMapper } from "./UnitMapper.js";

type SprWithRelations = PrismaSpr & {
  payments?: PrismaSprPayment[];
  customer?: PrismaCustomer | null;
  unit?: PrismaUnit | null;
};

export class SprMapper {
  static toDomain(prismaSpr: SprWithRelations): SprEntity {
    const entity: SprEntity = {
      id: prismaSpr.id,
      nomorSpr: prismaSpr.nomorSpr,
      customerId: prismaSpr.customerId,
      unitId: prismaSpr.unitId,
      marketingUserId: prismaSpr.marketingUserId,
      bankRekeningPtId: prismaSpr.bankRekeningPtId,

      hargaJual: prismaSpr.hargaJual.toNumber(),
      diskonPenjualan: prismaSpr.diskonPenjualan
        ? prismaSpr.diskonPenjualan.toNumber()
        : null,
      paketPromosi: prismaSpr.paketPromosi,
      caraPembayaran: prismaSpr.caraPembayaran,
      nilaiPengajuanKpr: prismaSpr.nilaiPengajuanKpr
        ? prismaSpr.nilaiPengajuanKpr.toNumber()
        : null,
      bankKpr: prismaSpr.bankKpr,
      status: prismaSpr.status,

      ttdPemesan: prismaSpr.ttdPemesan,
      tanggalTtdPemesan: prismaSpr.tanggalTtdPemesan,
      ttdMarketing: prismaSpr.ttdMarketing,
      tanggalTtdMarketing: prismaSpr.tanggalTtdMarketing,
      ttdSupervisor: prismaSpr.ttdSupervisor,
      tanggalTtdSupervisor: prismaSpr.tanggalTtdSupervisor,
      ttdManager: prismaSpr.ttdManager,
      tanggalTtdManager: prismaSpr.tanggalTtdManager,
      ttdSalesAdmin: prismaSpr.ttdSalesAdmin,
      tanggalTtdSalesAdmin: prismaSpr.tanggalTtdSalesAdmin,

      alasanBatal: prismaSpr.alasanBatal,
      agent: prismaSpr.agent,

      createdAt: prismaSpr.createdAt,
      updatedAt: prismaSpr.updatedAt,
    };

    if (prismaSpr.payments) {
      entity.payments = prismaSpr.payments.map((p) =>
        SprPaymentMapper.toDomain(p),
      );
    }

    if (prismaSpr.customer) {
      entity.customer = CustomerMapper.toDomain(prismaSpr.customer);
    }
    if (prismaSpr.unit) {
      entity.unit = UnitMapper.toDomain(prismaSpr.unit);
    }

    return entity;
  }
}
