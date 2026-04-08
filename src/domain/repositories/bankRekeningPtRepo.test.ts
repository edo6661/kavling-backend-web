import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { BankRekeningPtRepository } from "./bankRekeningPtRepo";
import {
  prismaTest,
  clearDatabase,
  disconnectDatabase,
} from "../../tests/setup";
import { ConflictError } from "../errors/ConflictError";
import { NotFoundError } from "../errors/NotFoundError";

describe("Integration Test: BankRekeningPtRepository", () => {
  let repo: BankRekeningPtRepository;

  beforeEach(async () => {
    await clearDatabase();
    repo = new BankRekeningPtRepository(prismaTest);
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe("create", () => {
    it("harus berhasil membuat rekening baru", async () => {
      const data = {
        namaBank: "BCA",
        noRekening: "123456789",
        atasNama: "PT Bumantara",
      };

      const result = await repo.create(data);

      expect(result.id).toBeDefined();
      expect(result.namaBank).toBe("BCA");
      expect(result.noRekening).toBe("123456789");

      const dbCheck = await prismaTest.bankRekeningPt.findUnique({
        where: { id: result.id },
      });
      expect(dbCheck).not.toBeNull();
    });

    it("harus melempar ConflictError jika nomor rekening sudah terdaftar", async () => {
      const data = { namaBank: "BCA", noRekening: "111222", atasNama: "PT A" };
      await repo.create(data);

      await expect(repo.create(data)).rejects.toThrow(ConflictError);
    });
  });

  describe("findById", () => {
    it("harus bisa mencari rekening berdasarkan ID", async () => {
      const created = await repo.create({
        namaBank: "BNI",
        noRekening: "333",
        atasNama: "PT B",
      });
      const found = await repo.findById(created.id);

      expect(found).not.toBeNull();
      expect(found?.noRekening).toBe("333");
    });
  });

  describe("update", () => {
    it("harus berhasil mengupdate data rekening", async () => {
      const created = await repo.create({
        namaBank: "Mandiri",
        noRekening: "444",
        atasNama: "PT C",
      });

      const updated = await repo.update(created.id, { namaBank: "BSI" });

      expect(updated.namaBank).toBe("BSI");
      expect(updated.noRekening).toBe("444");
    });

    it("harus melempar ConflictError jika update ke no rekening yang sudah dipakai entitas lain", async () => {
      await repo.create({
        namaBank: "BCA",
        noRekening: "123",
        atasNama: "PT A",
      });
      const created2 = await repo.create({
        namaBank: "BNI",
        noRekening: "456",
        atasNama: "PT B",
      });

      await expect(
        repo.update(created2.id, { noRekening: "123" }),
      ).rejects.toThrow(ConflictError);
    });
  });

  describe("delete", () => {
    it("harus berhasil menghapus rekening", async () => {
      const created = await repo.create({
        namaBank: "BRI",
        noRekening: "999",
        atasNama: "PT D",
      });
      await repo.delete(created.id);

      const check = await prismaTest.bankRekeningPt.findUnique({
        where: { id: created.id },
      });
      expect(check).toBeNull();
    });

    it("harus melempar NotFoundError jika rekening tidak ada saat dihapus", async () => {
      await expect(repo.delete(99999)).rejects.toThrow(NotFoundError);
    });
  });
});
