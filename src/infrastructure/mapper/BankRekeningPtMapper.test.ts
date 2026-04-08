import { describe, it, expect } from "vitest";
import { BankRekeningPtMapper } from "./BankRekeningPtMapper";

describe("BankRekeningPtMapper", () => {
  it("harus memetakan Prisma BankRekeningPt ke Domain Entity dengan benar", () => {
    const mockPrismaBank = {
      id: 1,
      namaBank: "BCA",
      noRekening: "1234567890",
      atasNama: "PT Sari Asih Group",
      createdAt: new Date(),
    };

    const domain = BankRekeningPtMapper.toDomain(mockPrismaBank);

    expect(domain.id).toBe(mockPrismaBank.id);
    expect(domain.namaBank).toBe(mockPrismaBank.namaBank);
    expect(domain.noRekening).toBe(mockPrismaBank.noRekening);
    expect(domain.atasNama).toBe(mockPrismaBank.atasNama);
    expect(domain.createdAt).toEqual(mockPrismaBank.createdAt);
  });
});
