import type { SprStatus, CaraPembayaran } from "@prisma/client";
import type { SprPaymentEntity } from "./SprPayment.js";
import type { CustomerEntity } from "./Customer.js";
import type { UnitEntity } from "./Unit.js";

export interface SprEntity {
  id: number;
  nomorSpr: string;
  customerId: number;
  unitId: number;
  marketingUserId: number;
  bankRekeningPtId: number;
  hargaJual: number;
  diskonPenjualan: number | null;
  paketPromosi: string | null;
  caraPembayaran: CaraPembayaran;
  nilaiPengajuanKpr: number | null;
  bankKpr: string | null;
  status: SprStatus;
  ttdPemesan: string | null;
  tanggalTtdPemesan: Date | null;
  ttdMarketing: string | null;
  tanggalTtdMarketing: Date | null;
  ttdSupervisor: string | null;
  tanggalTtdSupervisor: Date | null;
  ttdManager: string | null;
  tanggalTtdManager: Date | null;
  ttdSalesAdmin: string | null;
  tanggalTtdSalesAdmin: Date | null;
  alasanBatal: string | null;
  agent: string | null;
  payments?: SprPaymentEntity[];
  customer?: CustomerEntity;
  unit?: UnitEntity;
  createdAt: Date;
  updatedAt: Date;
}
