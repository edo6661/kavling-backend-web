import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { CustomerRepository } from "./customerRepo";
import {
  prismaTest,
  clearDatabase,
  disconnectDatabase,
} from "../../tests/setup";
import { ConflictError } from "../errors/ConflictError";
import { NotFoundError } from "../errors/NotFoundError";

describe("Integration Test: CustomerRepository", () => {
  let repo: CustomerRepository;

  beforeEach(async () => {
    // Bersihkan database sebelum setiap test agar datanya selalu fresh
    await clearDatabase();
    repo = new CustomerRepository(prismaTest);
  });

  afterAll(async () => {
    // Putuskan koneksi setelah semua test selesai
    await disconnectDatabase();
  });

  describe("create", () => {
    it("harus berhasil membuat customer baru", async () => {
      const data = {
        nikKtp: "3201234567890123",
        nama: "Budi Santoso",
        noHp: "081234567890",
        alamatKtp: "Jl. Merdeka No. 1",
      };

      const result = await repo.create(data);

      expect(result.id).toBeDefined();
      expect(result.nama).toBe("Budi Santoso");
      expect(result.nikKtp).toBe("3201234567890123");

      // Verifikasi data benar-benar masuk ke DB
      const dbCheck = await prismaTest.customer.findUnique({
        where: { id: result.id },
      });
      expect(dbCheck).not.toBeNull();
      expect(dbCheck?.nikKtp).toBe("3201234567890123");
    });

    it("harus melempar ConflictError jika NIK sudah terdaftar", async () => {
      const data = {
        nikKtp: "1111222233334444",
        nama: "Customer A",
        noHp: "08111",
        alamatKtp: "Alamat A",
      };

      // Insert pertama (sukses)
      await repo.create(data);

      // Insert kedua dengan NIK yang sama (harus gagal)
      await expect(repo.create(data)).rejects.toThrow(ConflictError);
    });
  });

  describe("findById & findByNik", () => {
    it("harus bisa mencari customer berdasarkan ID atau NIK", async () => {
      const created = await repo.create({
        nikKtp: "9999888877776666",
        nama: "Customer Find",
        noHp: "08999",
        alamatKtp: "Alamat Find",
      });

      const foundById = await repo.findById(created.id);
      expect(foundById).not.toBeNull();
      expect(foundById?.nama).toBe("Customer Find");

      const foundByNik = await repo.findByNik("9999888877776666");
      expect(foundByNik).not.toBeNull();
      expect(foundByNik?.id).toBe(created.id);
    });
  });

  describe("update", () => {
    it("harus berhasil mengupdate sebagian data customer", async () => {
      const created = await repo.create({
        nikKtp: "1234123412341234",
        nama: "Old Name",
        noHp: "08111",
        alamatKtp: "Old Address",
      });

      const updated = await repo.update(created.id, {
        nama: "New Name",
        noHp: "08222",
      });

      expect(updated.nama).toBe("New Name");
      expect(updated.noHp).toBe("08222");
      // NIK harus tetap sama
      expect(updated.nikKtp).toBe("1234123412341234");
    });

    it("harus melempar ConflictError jika update ke NIK yang sudah dipakai customer lain", async () => {
      await repo.create({
        nikKtp: "1111111111111111",
        nama: "Customer 1",
        noHp: "081",
        alamatKtp: "Alamat 1",
      });
      const customer2 = await repo.create({
        nikKtp: "2222222222222222",
        nama: "Customer 2",
        noHp: "082",
        alamatKtp: "Alamat 2",
      });

      // Customer 2 mencoba pakai NIK milik Customer 1
      await expect(
        repo.update(customer2.id, { nikKtp: "1111111111111111" }),
      ).rejects.toThrow(ConflictError);
    });

    it("harus melempar NotFoundError jika ID tidak ditemukan", async () => {
      await expect(repo.update(99999, { nama: "Ghost" })).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe("findWithCursorPagination", () => {
    it("harus mengembalikan data sesuai limit dan bisa difilter (search)", async () => {
      await repo.create({
        nikKtp: "1111",
        nama: "Ahmad",
        noHp: "081",
        alamatKtp: "X",
      });
      await repo.create({
        nikKtp: "2222",
        nama: "Budi",
        noHp: "082",
        alamatKtp: "Y",
      });
      await repo.create({
        nikKtp: "3333",
        nama: "Ahmad Budi",
        noHp: "083",
        alamatKtp: "Z",
      });

      // Test limit
      const resultLimit = await repo.findWithCursorPagination(2);
      expect(resultLimit.items).toHaveLength(2);
      expect(resultLimit.meta.hasNextPage).toBe(true);

      // Test search berdasarkan nama
      const resultSearch = await repo.findWithCursorPagination(10, undefined, {
        search: "Ahmad",
      });
      expect(resultSearch.items).toHaveLength(2); // "Ahmad" dan "Ahmad Budi"

      // Test search berdasarkan NIK
      const resultSearchNik = await repo.findWithCursorPagination(
        10,
        undefined,
        { search: "2222" },
      );
      expect(resultSearchNik.items).toHaveLength(1);
      expect(resultSearchNik.items[0]?.nama).toBe("Budi");
    });
  });

  describe("delete", () => {
    it("harus berhasil menghapus customer jika belum ada relasi SPR", async () => {
      const created = await repo.create({
        nikKtp: "5555555555555555",
        nama: "To Be Deleted",
        noHp: "085",
        alamatKtp: "Alamat",
      });

      await repo.delete(created.id);

      const check = await prismaTest.customer.findUnique({
        where: { id: created.id },
      });
      expect(check).toBeNull();
    });

    it("harus melempar NotFoundError jika customer tidak ada saat dihapus", async () => {
      await expect(repo.delete(99999)).rejects.toThrow(NotFoundError);
    });
  });
});
