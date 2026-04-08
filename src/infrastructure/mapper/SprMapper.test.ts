import { describe, it, expect } from "vitest";
import { SprMapper } from "./SprMapper";
import { Prisma, SprStatus, CaraPembayaran } from "@prisma/client";

describe("SprMapper", () => {
  it("harus memetakan Prisma Spr ke Domain Entity dengan benar", () => {
    const mockPrismaSpr: any = {
      id: 1,
      nomorSpr: "SPR-20260317-1234",
      customerId: 10,
      unitId: 20,
      marketingUserId: 30,
      bankRekeningPtId: 40,
      hargaJual: new Prisma.Decimal(500000000),
      diskonPenjualan: new Prisma.Decimal(10000000),
      paketPromosi: "Free Kanopi",
      caraPembayaran: CaraPembayaran.KPR_BRI,
      nilaiPengajuanKpr: new Prisma.Decimal(490000000),
      status: SprStatus.AKTIF,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const domain = SprMapper.toDomain(mockPrismaSpr);

    expect(domain.id).toBe(mockPrismaSpr.id);
    expect(domain.nomorSpr).toBe(mockPrismaSpr.nomorSpr);
    expect(domain.hargaJual).toBe(500000000);
    expect(domain.diskonPenjualan).toBe(10000000);
    expect(domain.nilaiPengajuanKpr).toBe(490000000);
    expect(domain.caraPembayaran).toBe(CaraPembayaran.KPR_BRI);
  });
});
