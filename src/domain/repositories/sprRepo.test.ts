import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { SprRepository } from "./sprRepo";
import {
  prismaTest,
  clearDatabase,
  disconnectDatabase,
} from "../../tests/setup";
import { ConflictError } from "../errors/ConflictError";
import {
  UnitFactory,
  CustomerFactory,
  UserFactory,
  BankRekeningPtFactory,
} from "../../tests/factories";
import { CaraPembayaran, UnitStatus, Role } from "@prisma/client";

describe("Integration Test: SprRepository", () => {
  let repo: SprRepository;

  beforeEach(async () => {
    await clearDatabase();
    repo = new SprRepository(prismaTest);
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe("create", () => {
    it("harus berhasil membuat SPR dan mengubah status unit menjadi BOOKING", async () => {
      const customer = await CustomerFactory.create();
      const unit = await UnitFactory.create({ status: UnitStatus.TERSEDIA });
      const marketing = await UserFactory.create({ role: Role.MARKETING });
      const bank = await BankRekeningPtFactory.create();

      const sprData = {
        customerId: customer.id,
        unitId: unit.id,
        marketingUserId: marketing.id,
        bankRekeningPtId: bank.id,
        hargaJual: 500000000,
        caraPembayaran: CaraPembayaran.KPR_BRI,
      };

      const result = await repo.create(sprData, "SPR-TEST-001");

      expect(result.id).toBeDefined();
      expect(result.nomorSpr).toBe("SPR-TEST-001");

      const updatedUnit = await prismaTest.unit.findUnique({
        where: { id: unit.id },
      });
      expect(updatedUnit?.status).toBe(UnitStatus.BOOKING);
    });

    it("harus melempar ConflictError jika unit tidak TERSEDIA", async () => {
      const customer = await CustomerFactory.create();
      const unit = await UnitFactory.create({ status: UnitStatus.TERJUAL });
      const marketing = await UserFactory.create();
      const bank = await BankRekeningPtFactory.create();

      const sprData = {
        customerId: customer.id,
        unitId: unit.id,
        marketingUserId: marketing.id,
        bankRekeningPtId: bank.id,
        hargaJual: 500000000,
        caraPembayaran: CaraPembayaran.CASH_KERAS,
      };

      await expect(repo.create(sprData, "SPR-TEST-002")).rejects.toThrow(
        ConflictError,
      );
    });
  });

  describe("delete", () => {
    it("harus menghapus SPR dan mengembalikan status unit ke TERSEDIA", async () => {
      const customer = await CustomerFactory.create();
      const unit = await UnitFactory.create({ status: UnitStatus.TERSEDIA });
      const marketing = await UserFactory.create();
      const bank = await BankRekeningPtFactory.create();

      const spr = await repo.create(
        {
          customerId: customer.id,
          unitId: unit.id,
          marketingUserId: marketing.id,
          bankRekeningPtId: bank.id,
          hargaJual: 500000000,
          caraPembayaran: CaraPembayaran.KPR_BRI,
        },
        "SPR-DEL-001",
      );

      await repo.delete(spr.id);

      const deletedSpr = await prismaTest.spr.findUnique({
        where: { id: spr.id },
      });
      expect(deletedSpr).toBeNull();

      const restoredUnit = await prismaTest.unit.findUnique({
        where: { id: unit.id },
      });
      expect(restoredUnit?.status).toBe(UnitStatus.TERSEDIA);
    });
  });
});
