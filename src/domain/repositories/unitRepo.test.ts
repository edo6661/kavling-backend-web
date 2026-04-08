import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { UnitRepository } from "./unitRepo";
import {
  prismaTest,
  clearDatabase,
  disconnectDatabase,
} from "../../tests/setup";
import { ConflictError } from "../errors/ConflictError";
import { NotFoundError } from "../errors/NotFoundError";
import { UnitStatus, Role } from "@prisma/client";
import {
  UnitFactory,
  SprFactory,
  CustomerFactory,
  UserFactory,
  BankRekeningPtFactory,
} from "../../tests/factories";

describe("Integration Test: UnitRepository", () => {
  let repo: UnitRepository;

  beforeEach(async () => {
    await clearDatabase();
    repo = new UnitRepository(prismaTest);
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe("create", () => {
    it("harus berhasil membuat unit baru", async () => {
      const data = {
        namaPerumahan: "Bumantara",
        blokUnit: "A1",
        tipe: "36/60",
        luasTanah: 60,
        luasBangunan: 36,
        lantai: 1,
        lokasiStrategis: "Pojok",
        status: UnitStatus.TERSEDIA,
      };

      const unit = await repo.create(data);

      expect(unit.id).toBeDefined();
      expect(unit.namaPerumahan).toBe("Bumantara");
      expect(unit.blokUnit).toBe("A1");

      const dbCheck = await prismaTest.unit.findUnique({
        where: { id: unit.id },
      });
      expect(dbCheck).not.toBeNull();
      expect(dbCheck?.status).toBe(UnitStatus.TERSEDIA);
    });

    it("harus melempar ConflictError jika blok unit sudah ada di perumahan yang sama", async () => {
      await UnitFactory.create({ namaPerumahan: "Bumantara", blokUnit: "A1" });

      await expect(
        repo.create({
          namaPerumahan: "Bumantara",
          blokUnit: "A1",
        }),
      ).rejects.toThrow(ConflictError);
    });
  });

  describe("findById & findByBlok", () => {
    it("harus bisa mencari unit berdasarkan ID", async () => {
      const unit = await UnitFactory.create();
      const found = await repo.findById(unit.id);

      expect(found).not.toBeNull();
      expect(found?.id).toBe(unit.id);
    });

    it("harus bisa mencari unit berdasarkan blok dan nama perumahan", async () => {
      await UnitFactory.create({ namaPerumahan: "Bumantara", blokUnit: "B2" });
      const found = await repo.findByBlok("Bumantara", "B2");

      expect(found).not.toBeNull();
      expect(found?.blokUnit).toBe("B2");
    });
  });

  describe("update", () => {
    it("harus berhasil mengupdate sebagian data unit", async () => {
      const unit = await UnitFactory.create({ tipe: "36/60" });

      const updated = await repo.update(unit.id, {
        tipe: "45/90",
        status: UnitStatus.TERJUAL,
      });

      expect(updated.tipe).toBe("45/90");
      expect(updated.status).toBe(UnitStatus.TERJUAL);

      const dbCheck = await prismaTest.unit.findUnique({
        where: { id: unit.id },
      });
      expect(dbCheck?.tipe).toBe("45/90");
    });

    it("harus melempar ConflictError jika update blok ke blok yang sudah dipakai unit lain", async () => {
      await UnitFactory.create({ namaPerumahan: "Bumantara", blokUnit: "A1" });
      const unit2 = await UnitFactory.create({
        namaPerumahan: "Bumantara",
        blokUnit: "A2",
      });

      await expect(repo.update(unit2.id, { blokUnit: "A1" })).rejects.toThrow(
        ConflictError,
      );
    });

    it("harus melempar NotFoundError jika ID unit tidak ditemukan saat update", async () => {
      await expect(repo.update(999999, { tipe: "45/90" })).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe("delete", () => {
    it("harus berhasil menghapus unit jika belum ada relasi SPR", async () => {
      const unit = await UnitFactory.create();
      await repo.delete(unit.id);

      const check = await prismaTest.unit.findUnique({
        where: { id: unit.id },
      });
      expect(check).toBeNull();
    });

    it("harus melempar NotFoundError jika unit tidak ada saat dihapus", async () => {
      await expect(repo.delete(999999)).rejects.toThrow(NotFoundError);
    });

    it("harus melempar ConflictError jika unit tidak dapat dihapus karena terhubung dengan SPR (P2003)", async () => {
      const marketing = await UserFactory.create({ role: Role.MARKETING });
      const customer = await CustomerFactory.create();
      const bank = await BankRekeningPtFactory.create();
      const unit = await UnitFactory.create();

      await SprFactory.create({
        unitId: unit.id,
        marketingUserId: marketing.id,
        customerId: customer.id,
        bankRekeningPtId: bank.id,
      });

      await expect(repo.delete(unit.id)).rejects.toThrow(ConflictError);
      await expect(repo.delete(unit.id)).rejects.toThrow(
        "Unit tidak dapat dihapus karena sudah terhubung dengan data Surat Pesanan Rumah (SPR).",
      );
    });
  });

  describe("findWithCursorPagination", () => {
    it("harus mengembalikan data unit sesuai limit dan kondisi meta", async () => {
      await UnitFactory.create({
        namaPerumahan: "Bumantara",
        blokUnit: "A1",
        status: UnitStatus.TERSEDIA,
      });
      await UnitFactory.create({
        namaPerumahan: "Bumantara",
        blokUnit: "A2",
        status: UnitStatus.TERSEDIA,
      });
      await UnitFactory.create({
        namaPerumahan: "Bumantara",
        blokUnit: "B1",
        status: UnitStatus.TERJUAL,
      });

      const result = await repo.findWithCursorPagination(2, undefined, {
        status: UnitStatus.TERSEDIA,
      });

      expect(result.items).toHaveLength(2);
      expect(result.meta.hasNextPage).toBe(false);
    });

    it("harus bisa mencari data unit berdasarkan keyword search (nama perumahan/blok)", async () => {
      await UnitFactory.create({
        namaPerumahan: "Griya Mapan",
        blokUnit: "C1",
      });
      await UnitFactory.create({
        namaPerumahan: "Bumantara",
        blokUnit: "A1",
      });

      const result = await repo.findWithCursorPagination(10, undefined, {
        search: "Griya",
      });
      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.namaPerumahan).toBe("Griya Mapan");
    });
  });
});
