import { describe, it, expect } from "vitest";
import { UnitMapper } from "./UnitMapper";
import { UnitStatus } from "@prisma/client";

describe("UnitMapper", () => {
  it("harus memetakan Prisma Unit ke Domain Entity dengan benar", () => {
    const mockPrismaUnit: any = {
      id: 1,
      namaPerumahan: "Bumantara Residence",
      blokUnit: "A1",
      tipe: "36/60",
      luasTanah: 60,
      luasBangunan: 36,
      lantai: 1,
      lokasiStrategis: "Dekat Taman",
      status: UnitStatus.TERSEDIA,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const domain = UnitMapper.toDomain(mockPrismaUnit);

    expect(domain.id).toBe(mockPrismaUnit.id);
    expect(domain.namaPerumahan).toBe(mockPrismaUnit.namaPerumahan);
    expect(domain.blokUnit).toBe(mockPrismaUnit.blokUnit);
    expect(domain.tipe).toBe(mockPrismaUnit.tipe);
    expect(domain.luasTanah).toBe(mockPrismaUnit.luasTanah);
    expect(domain.luasBangunan).toBe(mockPrismaUnit.luasBangunan);
    expect(domain.lantai).toBe(mockPrismaUnit.lantai);
    expect(domain.lokasiStrategis).toBe(mockPrismaUnit.lokasiStrategis);
    expect(domain.status).toBe(mockPrismaUnit.status);
    expect(domain.createdAt).toEqual(mockPrismaUnit.createdAt);
    expect(domain.updatedAt).toEqual(mockPrismaUnit.updatedAt);
  });
});
